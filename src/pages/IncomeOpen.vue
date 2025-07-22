<template>
    <div class="container mt-5">
      <h2>Registrar Ingreso</h2>
  
      <!-- Pestañas -->
      <div class="btn-group mb-4">
        <button 
          @click="activeTab = 'registro'"
          :class="['btn', activeTab==='registro' ? 'btn-primary':'btn-outline-primary']"
        >Registro</button>
        <button 
          @click="activeTab = 'ingresos'"
          :class="['btn', activeTab==='ingresos' ? 'btn-primary':'btn-outline-primary']"
        >Ingresos</button>
      </div>
  
      <!-- TAB: Registro -->
      <div v-if="activeTab==='registro'">
        <form @submit.prevent="addInvoice" class="row g-3">
  
          <!-- Carrito de items -->
          <h5>Carrito</h5>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Nombre Item</th>
                <th>Precio Venta</th>
                <th>Cantidad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
                <tr v-for="(item, idx) in newInvoice.cart" :key="idx">
                    <td>{{ item.name }}</td>
                    <td>{{ formatNumber(item.priceSale) }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>
                    <button class="btn btn-sm btn-danger" @click.prevent="removeCartItem(idx)">
                        ✕
                    </button>
                    </td>
                </tr>
                <tr v-if="newInvoice.cart.length === 0">
                    <td>
                    <input v-model="cartLine.name" type="text" class="form-control" placeholder="Nombre" required/>
                    </td>
                    <td>
                    <input v-model.number="cartLine.priceSale" type="number" class="form-control" step="0.01" required/>
                    </td>
                    <td>
                    <input v-model.number="cartLine.quantity" type="number" class="form-control" min="1" required/>
                    </td>
                    <td>
                    <button class="btn btn-sm btn-outline-success" @click.prevent="addCartItem">
                        Agregar
                    </button>
                    </td>
                </tr>
            </tbody>
          </table>
  
          <!-- Datos de la factura -->
          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Cliente</label>
              <select v-model="newInvoice.customer" class="form-select" required>
                <option value="">Seleccione un cliente</option>
                <option v-for="c in contacts" :key="c.id" :value="c">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Fecha de Vencimiento</label>
              <input v-model="newInvoice.dueDate" type="date" class="form-control" required/>
            </div>
            <div class="col-md-4">
              <label class="form-label">Método de Pago</label>
              <input v-model="newInvoice.paymentMethod" type="text" class="form-control" placeholder="e.g. Efectivo"/>
            </div>
          </div>
  
          <div class="row mt-3">
            <div class="col-md-4">
              <label class="form-label">Número de Factura</label>
              <input v-model="newInvoice.invoiceNumber" type="number" class="form-control" readonly/>
            </div>
            <div class="col-md-4">
              <label class="form-label">Estado de Pago</label>
              <select v-model="newInvoice.paymentStatus" class="form-select">
                <option :value="false">Pendiente</option>
                <option :value="true">Pagado</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Total</label>
              <input :value="formatNumber(newInvoice.total)" type="text" class="form-control" readonly/>
            </div>
          </div>
  
          <div class="row mt-4">
            <div class="col-12">
              <button type="submit" class="btn btn-primary">Guardar Ingreso</button>
            </div>
          </div>
        </form>
      </div>
  
      <!-- TAB: Ingresos -->
      <div v-if="activeTab==='ingresos'">
        <h3>Ingresos Registrados</h3>
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead class="table-dark">
              <tr>
                <th>Fecha</th>
                <th>#Factura</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in openInvoices" :key="inv.id">
                <td>{{ formatDisplayDate(inv.createdAt) }}</td>
                <td>{{ inv.invoiceNumber }}</td>
                <td>{{ inv.customer?.name }}</td>
                <td>${{ formatNumber(inv.total) }}</td>
                <td>
                  <span 
                    class="badge" 
                    :class="inv.paymentStatus ? 'bg-success':'bg-warning'"
                  >
                    {{ inv.paymentStatus ? 'Pagado':'Pendiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { db } from '../firebase'
  import { 
    collection, addDoc, getDocs, doc, runTransaction, query, where, getDoc
  } from 'firebase/firestore'
  import { useRoute } from 'vue-router'
  
  export default {
    name: 'IncomeOpen',
    setup() {
      const route = useRoute()
      const businessId = localStorage.getItem('businessId') || ''
      const turnId     = route.params.turnId || 'currentTurnId'
  
      const activeTab = ref('registro')
  
      // Carrito dinámico
      const cartLine = ref({ name:'', priceSale:0, quantity:1 })
      const newInvoice = ref({
        cart: [],
        customer: null,
        dueDate: new Date().toISOString().substr(0,10),
        paymentMethod: '',
        invoiceNumber: 0,
        paymentStatus: false,
        orderType: 'normal',
        deliveryStatus: false,
        total: 0,
        turnId
      })
  
      const contacts     = ref([])
      const openInvoices = ref([])

      async function peekNextInvoiceNumber() {
        const counterRef = doc(db, 'businesses', businessId, 'counters', 'invoices')
        const snap = await getDoc(counterRef)
        if (!snap.exists()) {
            return 1
        }
        const current = snap.data().counter || 0
        return current + 1
        }
  
      // Mapas para next invoice number
      const getNextInvoiceNumber = async () => {
        const counterRef = doc(db,'businesses',businessId,'counters','invoices')
        return runTransaction(db, async tx => {
          const snap = await tx.get(counterRef)
          let next = 1
          if (!snap.exists()) {
            tx.set(counterRef,{ counter:1 })
            next = 1
          } else {
            next = snap.data().counter + 1
            tx.update(counterRef,{ counter: next })
          }
          return next
        })
      }
  
      // Cargar clientes y facturas
      const fetchData = async () => {
        // contactos
        const cSnap = await getDocs(collection(db,'businesses',businessId,'contacts'))
        contacts.value = cSnap.docs.map(d=>({id:d.id,...d.data()}))
  
        // next invoice number
        
        //newInvoice.value.invoiceNumber = await peekNextInvoiceNumber()
  
        // facturas del turno
        const q = query(
          collection(db,'businesses',businessId,'invoices'),
          where('turnId','==',turnId)
        )
        const sq = await getDocs(q)
        openInvoices.value = sq.docs.map(d=>({id:d.id,...d.data()}))
      }

      const calculateTotal = () => {
        newInvoice.value.total = newInvoice.value.cart.length
            ? newInvoice.value.cart[0].priceSale * newInvoice.value.cart[0].quantity
            : 0;
        };
  
      const addCartItem = () => {
        // Sólo permitimos un ítem: si no hay, lo agregamos
        newInvoice.value.cart = [{ ...cartLine.value }];
        calculateTotal();

        // Opcional: si quieres resetear los inputs tras agregar
        cartLine.value = { name:'', priceSale:0, quantity:1 };
        };

      const removeCartItem = (idx) => {
        newInvoice.value.cart.splice(idx, 1);
        calculateTotal();

        // Prepara de nuevo la línea para que el usuario ingrese otra si quiere
        cartLine.value = { name:'', priceSale:0, quantity:1 };
        };
  
      // Guardar factura
      const addInvoice = async () => {
        const [y, m, d] = newInvoice.value.dueDate.split('-').map(Number);
        try {
          const nextNum = await getNextInvoiceNumber()
          newInvoice.value.invoiceNumber = nextNum
          const data = {
            ...newInvoice.value,
            createdAt: new Date(y, m - 1, d, 0, 0, 0),
        }
          await addDoc(
            collection(db,'businesses',businessId,'invoices'),
            data
          )
          // reset
          newInvoice.value = {
            cart:[], customer:null,
            dueDate:new Date().toISOString().substr(0,10),
            paymentMethod:'', invoiceNumber: newInvoice.value.invoiceNumber + 1,
            paymentStatus:false, orderType:'normal',
            deliveryStatus:false, total:0, turnId
          }
          await fetchData()
          activeTab.value = 'ingresos'
        } catch (err) {
          console.error('Error al crear factura:', err)
          alert('No se pudo registrar el ingreso.')
        }
      }
  
      const formatNumber = num =>
        Number(num).toLocaleString('es-CO')
  
      const formatDisplayDate = dt => {
        if (dt?.seconds) {
          return new Date(dt.seconds*1000)
            .toLocaleString('es-CO',{ hour12:true })
        }
        return ''
      }
  
      onMounted(async () => {
        newInvoice.value.invoiceNumber = await peekNextInvoiceNumber()
        await fetchData()   // si necesitas recargar la lista de facturas
      })
  
      return {
        activeTab, cartLine, newInvoice,
        contacts, openInvoices,
        addCartItem, removeCartItem, addInvoice,
        formatNumber, formatDisplayDate,
      }
    }
  }
  </script>
  
  <style scoped>
  .table-responsive { overflow-x:auto }
  .badge { padding:0.5em }
  </style>
  