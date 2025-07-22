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
              <span class="badge bg-secondary ms-1">{{ getOrderCount(tab.status) }}</span>
            </button>
          </li>
        </ul>
      </div>
  
      <div class="list-group">
        <div
          v-for="{ id, ...orderProps } in filteredOrders"
          :key="id"
          class="list-group-item list-group-item-action"
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
              <button
                class="btn btn-sm btn-outline-primary"
                @click.stop="openOrderDetails({ id, ...orderProps })"
              >
                Ver detalles
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal de detalles del pedido -->
      <div class="modal fade" id="orderDetailsModal" tabindex="-1" aria-hidden="true" ref="orderDetailsModalRef">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Pedido #{{ getShortCode(selectedOrder?.id, 4) }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="selectedOrder">
                <div class="row mb-4">
                  <div class="col-md-6">
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
                  <div class="col-md-6">
                    <h6>Método de pago</h6>
                    <p>{{ getPaymentMethodName(selectedOrder.paymentMethod) }}</p>
                  </div>
                </div>
  
                <div class="mb-4">
                  <h6>Productos</h6>
                  <div 
                    v-for="(item, index) in selectedOrder.items" 
                    :key="index"
                    class="d-flex justify-content-between py-2 border-bottom"
                  >
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
  
                <div class="d-flex justify-content-between fw-bold mt-3">
                  <span>Total:</span>
                  <span>${{ selectedOrder.total.toLocaleString() }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
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
  import { Modal } from 'bootstrap'; // Importa la clase Modal de Bootstrap

  
  const db = getFirestore();
  const orderDetailsModalRef = ref(null);
  const businessId = localStorage.getItem('businessId') || ''
  let orderDetailsModalInstance = null;

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
    orderDetailsModalInstance = new Modal(orderDetailsModalRef.value);

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
    if (activeTab.value === 'all') return orders.value;
    return orders.value.filter(order => order.status === activeTab.value);
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
  
  const openOrderDetails = (order) => {
    selectedOrder.value = { ...order };
    // Usa la instancia del modal de Bootstrap para mostrarlo
    if (orderDetailsModalInstance) {
      orderDetailsModalInstance.show();
    } else {
      console.error("La instancia del modal no se ha inicializado.");
    }
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
  </script>