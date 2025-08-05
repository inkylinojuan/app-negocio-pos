<template>
    <div class="container mt-4">
      <div id="notifications-container" class="position-fixed top-0 end-0 p-3" style="z-index: 9999"></div>
      <h1 class="mb-4">Pedidos</h1>
      
             <div class="mb-3">
         <ul class="nav nav-tabs">
           <li class="nav-item" v-for="tab in tabs" :key="tab.status">
             <button 
               class="nav-link"
               :class="{ 'active': activeTab === tab.status }"
               @click="activeTab = tab.status"
             >
               {{ tab.label }}
               <span class="badge bg-secondary ms-1">{{ getFilteredOrderCount(tab.status) }}</span>
             </button>
           </li>
         </ul>
       </div>

       <!-- Buscador de pedidos por número -->
       <div class="mb-3">
         <div class="input-group">
           <span class="input-group-text">
             <i class="bi bi-search"></i>
           </span>
           <input 
             v-model="searchQuery" 
             type="text" 
             class="form-control" 
             placeholder="Buscar por número de pedido..."
           />
           <button 
             v-if="searchQuery" 
             class="btn btn-outline-secondary" 
             @click="clearSearch"
             type="button"
           >
             <i class="bi bi-x"></i>
           </button>
         </div>
       </div>
  
             <div class="list-group">
         <div
           v-for="{ id, ...orderProps } in filteredOrders"
           :key="id"
           class="list-group-item list-group-item-action order-item"
           @click="openOrderDetails({ id, ...orderProps })"
         >
           <div class="d-flex justify-content-between align-items-start">
             <div>
               <h5 class="mb-1">Pedido #{{ getShortCode(id, 4) }}</h5>
               <small class="text-muted">{{ formatDate(orderProps.createdAt) }}</small>
               <div class="mt-2">
                 <span class="badge" :class="getStatusBadgeClass(orderProps.status)">
                   {{ getStatusMessage(orderProps.status) }}
                 </span>
               </div>
             </div>
             <div class="text-end">
               <h6 class="mb-1">${{ orderProps.total.toLocaleString() }}</h6>
               <small class="text-muted">Haz clic para ver detalles</small>
             </div>
           </div>
         </div>
       </div>
   
       <!-- Overlay para cerrar sidebar al hacer clic fuera -->
       <div 
         v-if="selectedOrder" 
         class="sidebar-overlay" 
         @click="closeOrderDetails"
       ></div>
   
       <!-- Sidebar derecho para detalles del pedido -->
       <div class="order-details-sidebar" :class="{ 'open': selectedOrder }">
         <div class="sidebar-header">
           <h5 class="mb-0">Pedido #{{ getShortCode(selectedOrder?.id, 4) }}</h5>
           <button type="button" class="btn-close" @click="closeOrderDetails"></button>
         </div>
         <div class="sidebar-body" v-if="selectedOrder">
           <div class="mb-4">
             <h6>Estado actual</h6>
             <select 
               class="form-select"
               v-model="selectedOrder.status"
               @change="updateOrderStatus"
             >
               <option value="pending">Recibido</option>
               <option value="preparing">En preparación</option>
               <option value="ready">Listo</option>
               <option value="delivered">En camino</option>
               <option value="completed">Completado</option>
               <option value="cancelled">Cancelado</option>
             </select>
           </div>
           
           <div class="mb-4">
             <h6>Método de pago</h6>
             <p class="mb-0">{{ getPaymentMethodName(selectedOrder.paymentMethod) }}</p>
           </div>
   
           <div class="mb-4">
             <h6>Productos</h6>
             <div 
               v-for="(item, index) in selectedOrder.items" 
               :key="index"
               class="product-item"
             >
               <div class="d-flex justify-content-between">
                 <div>
                   <span class="fw-bold">{{ item.quantity }}x</span> {{ item.name }}
                   <div v-if="item.extras && item.extras.length > 0" class="small text-muted">
                     Extras: {{ item.extras.map(e => e.name).join(', ') }}
                   </div>
                   <div v-if="item.specialInstructions" class="small text-muted">
                     Nota: {{ item.specialInstructions }}
                   </div>
                 </div>
                 <span>${{ (item.price * item.quantity).toLocaleString() }}</span>
               </div>
             </div>
           </div>
   
           <div class="order-total">
             <div class="d-flex justify-content-between fw-bold">
               <span>Total:</span>
               <span>${{ selectedOrder.total.toLocaleString() }}</span>
             </div>
           </div>
         </div>
       </div>
     </div>
   </template>
  
  <script setup>
     import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
   import { getFirestore, collection, query, where, doc, updateDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
   import { setupOrderNotifications } from '../services/notifications';
 
   
   const db = getFirestore();
   const businessId = localStorage.getItem('businessId') || ''

  let unsubscribe = ref(null);

  const tabs = [
    { status: 'pending', label: 'Pendientes' },
    { status: 'preparing', label: 'En preparación' },
    { status: 'ready', label: 'Listos' },
    { status: 'delivered', label: 'En camino' },
    { status: 'all', label: 'Todos' }
  ];
  
  const activeTab = ref('pending');
  const orders = ref([]);
  const selectedOrder = ref(null);
  const searchQuery = ref('');
  
     onMounted(() => {
     loadOrders();
     setupOrderNotifications((notification) => {
       switch(notification.type) {
         case 'new-order':
           const newOrder = {
             id: notification.orderId,
             ...notification.data,
             createdAt: notification.data.createdAt?.toDate()
           };
           // Sólo añadimos si no existe ya ese id
           if (!orders.value.some(o => o.id === newOrder.id)) {
             orders.value.unshift(newOrder);
           }
           break;
 
         case 'status-changed':
           // … tu lógica existente …
           break;
       }
     });
 
     onBeforeUnmount(unsubscribe);
   });

  onUnmounted(() => {
    if (unsubscribe.value) {
        unsubscribe.value();
    }
  });

  function getShortCode(id, length = 4) {
    if (typeof id !== 'string') return ''
    let hash = 5381
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 33) ^ id.charCodeAt(i)
    }
    const unsigned = hash >>> 0
    const max = 10 ** length
    return (unsigned % max).toString().padStart(length, '0')
  }
  
  const loadOrders = async () => {
    try {
      const q = query(
        collection(db, 'businesses', businessId, 'orders'),
        where('businessId', '==', businessId)
      );
      
      const querySnapshot = await getDocs(q);
      orders.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() // Convertir aquí el timestamp
      }));
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };
  
  const filteredOrders = computed(() => {
    let filtered = orders.value;
    
    // Si hay búsqueda activa, buscar en todos los pedidos sin importar la pestaña
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      filtered = orders.value.filter(order => {
        const orderNumber = getShortCode(order.id, 4).toLowerCase();
        return orderNumber.includes(query);
      });
    } else {
      // Si no hay búsqueda, filtrar por estado de la pestaña
      if (activeTab.value !== 'all') {
        filtered = orders.value.filter(order => order.status === activeTab.value);
      }
    }
    
    // Ordenar del más antiguo al más reciente (ascendente por fecha)
    return filtered.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateA - dateB; // Orden ascendente (más antiguo primero)
    });
  });
  
  const getOrderCount = (status) => {
    if (status === 'all') return orders.value.length;
    return orders.value.filter(order => {
      // Intentamos obtener el estado del nivel superior, si no existe,
      // intentamos obtener el último estado del historial.
      const currentStatus = order?.status || order?.statusHistory?.slice(-1)[0]?.status;
      return currentStatus === status;
    }).length;
  };

  const getFilteredOrderCount = (status) => {
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      const filteredBySearch = orders.value.filter(order => {
        const orderNumber = getShortCode(order.id, 4).toLowerCase();
        return orderNumber.includes(query);
      });
      
      if (status === 'all') return filteredBySearch.length;
      
      return filteredBySearch.filter(order => {
        const currentStatus = order?.status || order?.statusHistory?.slice(-1)[0]?.status;
        return currentStatus === status;
      }).length;
    } else {
      return getOrderCount(status);
    }
  };
  
     const openOrderDetails = (order) => {
     selectedOrder.value = { ...order };
   };

   const closeOrderDetails = () => {
     selectedOrder.value = null;
   };
  
  const updateOrderStatus = async () => {
    try {
      const orderRef = doc(db, 'businesses', businessId, 'orders', selectedOrder.value.id);
      const estimatedTimestamp = new Date(); // Mover aquí para consistencia

      // Actualización en Firestore
      await updateDoc(orderRef, {
        status: selectedOrder.value.status,
        updatedAt: serverTimestamp(),
        [`statusHistory.${estimatedTimestamp.toISOString()}`]: {
          status: selectedOrder.value.status,
          timestamp: serverTimestamp(),
          message: `Estado actualizado a ${getStatusMessage(selectedOrder.value.status)}`
        }
      });

      // Actualización local
      const index = orders.value.findIndex(o => o.id === selectedOrder.value.id);
      if (index !== -1) {
        orders.value[index] = {
          ...orders.value[index],
          status: selectedOrder.value.status,
          updatedAt: estimatedTimestamp,
          statusHistory: {
            ...orders.value[index].statusHistory, // Mantenemos el formato de objeto
            [estimatedTimestamp.toISOString()]: {
              status: selectedOrder.value.status,
              timestamp: estimatedTimestamp,
              message: `Estado actualizado a ${getStatusMessage(selectedOrder.value.status)}`
            }
          }
        };
      }

    } catch (error) {
      console.error("Error updating order status:", error);
      alert('Error al actualizar el estado del pedido: ' + error.message);
    }
  };
  
  const getStatusMessage = (status) => {
    const messages = {
      pending: "Recibido",
      preparing: "En preparación",
      ready: "Listo",
      delivered: "En camino",
      completed: "Completado",
      cancelled: "Cancelado"
    };
    return messages[status] || status;
  };
  
  const getPaymentMethodName = (method) => {
    const methods = {
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia"
    };
    return methods[method] || method;
  };
  
  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: "bg-secondary",
      preparing: "bg-info",
      ready: "bg-warning text-dark",
      delivered: "bg-primary",
      completed: "bg-success",
      cancelled: "bg-danger"
    };
    return classes[status] || "bg-secondary";
  };
  
  const formatDate = (timestamp) => {
    // Verificar si es un objeto Timestamp de Firestore
    if (timestamp?.toDate) {
      const date = timestamp.toDate(); // Convertir a Date de JavaScript
      return date.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si ya es un Date de JavaScript
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return ''; // En caso de formato desconocido
  };

     const clearSearch = () => {
     searchQuery.value = '';
   };
   </script>

   <style scoped>
   /* Estilos para los items de pedido */
   .order-item {
     cursor: pointer;
     transition: background-color 0.2s ease;
   }

   .order-item:hover {
     background-color: #f8f9fa;
   }

   /* Overlay para cerrar sidebar */
   .sidebar-overlay {
     position: fixed;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     background-color: rgba(0, 0, 0, 0.3);
     z-index: 1040;
     animation: fadeIn 0.3s ease;
   }

   @keyframes fadeIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }

   /* Sidebar derecho para detalles del pedido */
   .order-details-sidebar {
     position: fixed;
     top: 0;
     right: -400px;
     width: 400px;
     height: 100vh;
     background-color: #fff;
     border-left: 1px solid #dee2e6;
     box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
     transition: right 0.3s ease;
     z-index: 1050;
     display: flex;
     flex-direction: column;
   }

   .order-details-sidebar.open {
     right: 0;
   }

   .sidebar-header {
     padding: 1rem;
     border-bottom: 1px solid #dee2e6;
     background-color: #f8f9fa;
     display: flex;
     justify-content: space-between;
     align-items: center;
   }

   .sidebar-body {
     flex: 1;
     padding: 1rem;
     overflow-y: auto;
   }

   .product-item {
     padding: 0.75rem 0;
     border-bottom: 1px solid #f1f3f4;
   }

   .product-item:last-child {
     border-bottom: none;
   }

   .order-total {
     padding: 1rem 0;
     border-top: 2px solid #dee2e6;
     margin-top: auto;
   }

   /* Responsive */
   @media (max-width: 768px) {
     .order-details-sidebar {
       width: 100%;
       right: -100%;
     }
   }
   </style>