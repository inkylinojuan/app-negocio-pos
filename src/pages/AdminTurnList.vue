<template>
    <div class="container mt-5">
      <h2>Listado de Turnos</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Turno</th>
            <th>Fecha y Hora de Apertura</th>
            <th>Fecha y Hora de Cierre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="turn in turns" :key="turn.id">
            <td>{{ turn.turnIdentifier }}</td>
            <td>{{ formatDate(turn.openedAt) }}</td>
            <td>{{ formatDate(turn.closedAt) }}</td>
            <td>
              <button class="btn btn-info btn-sm" @click="viewTurnDetail(turn)">
                Ventas
              </button>
              <button class="btn btn-secondary btn-sm ms-2" @click="openInventoryModal(turn)">
                Inventario
              </button>
              <button class="btn btn-primary btn-sm ms-2" @click="openDomiciliosModal(turn)">
                Domicilios
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Modal para mostrar detalles de inventario -->
      <div class="modal fade" id="inventoryModal" tabindex="-1" aria-labelledby="inventoryModalLabel" aria-hidden="true" ref="inventoryModal">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="inventoryModalLabel">
                Inventario del Turno: {{ currentTurn.turnIdentifier }}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="closeInventoryModal"></button>
            </div>
            <div class="modal-body">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Inventario Inicial</th>
                    <th>Inventario Final</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prod in combinedProducts" :key="prod.prodId">
                    <td>{{ getProductName(prod.prodId) }}</td>
                    <td>{{ prod.initial }}</td>
                    <td>{{ prod.final }}</td>
                    <td>{{ prod.initial - prod.final }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="currentTurn.inventoryNote && currentTurn.inventoryNote.trim() !== ''" class="mt-2">
                <strong>Notas:</strong> {{ currentTurn.inventoryNote }}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeInventoryModal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal para mostrar reporte de domicilios (pedidos de mensajería) -->
      <div class="modal fade" id="domiciliosModal" tabindex="-1" aria-labelledby="domiciliosModalLabel" aria-hidden="true" ref="domiciliosModal">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="domiciliosModalLabel">
                Reporte de Domicilios del Turno: {{ currentTurn.turnIdentifier }}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="closeDomiciliosModal"></button>
            </div>
            <div class="modal-body">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Número de Factura</th>
                    <th>Fecha y Hora</th>
                    <th>Total</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Estado Pedido</th>
                    <th>Estado Pago</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="invoice in domicilios" :key="invoice.id">
                    <td>{{ invoice.invoiceNumber || invoice.id }}</td>
                    <td>{{ formatDate(invoice.createdAt) }}</td>
                    <td>{{ invoice.total }}</td>
                    <td>{{ invoice.deliveryInfo?.address || '-' }}</td>
                    <td>{{ invoice.deliveryInfo?.phone || '-' }}</td>
                    <td>{{ invoice.status }}</td>
                    <td>
                      <span v-if="invoice.paymentStatus" class="text-success">Pagado</span>
                      <span v-else class="text-danger">No Pagado</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3"><strong>Total Ventas Domicilio:</strong></td>
                    <td colspan="4">{{ totalDeliverySales }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDomiciliosModal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { collection, query, orderBy, where, getDocs } from 'firebase/firestore'
  import { db } from '../firebase'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  
  export default {
    name: 'AdminTurnList',
    setup() {
      const turns = ref([])
      const currentTurn = ref({})
      const router = useRouter()
      const businessId = localStorage.getItem('businessId') || ''
      
      // Refs para los modales
      const inventoryModal = ref(null)
      const domiciliosModal = ref(null)
      
      // Ref para domicilios (facturas de delivery del turno actual)
      const domicilios = ref([])
      
      // Ref para productos globales (para obtener nombres)
      const allProducts = ref([])
      
      // Obtener businessInfo desde Pinia (si lo requieres)
      const authStore = useAuthStore()
      const businessInfo = computed(() => authStore.businessInfo)
      
      // Función para cargar productos
      const fetchProducts = async () => {
        const productsCol = collection(db, 'businesses', businessId, 'products')
        const snap = await getDocs(productsCol)
        allProducts.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
      
      // Función para obtener todos los turnos
      const fetchTurns = async () => {
        const turnsCol = collection(db, 'businesses', businessId, 'turns')
        const q = query(turnsCol, orderBy('openedAt', 'desc'))
        const snap = await getDocs(q)
        turns.value = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
      
      // Función para formatear fecha
      const formatDate = (timestamp) => {
        if (timestamp && timestamp.seconds) {
          return new Date(timestamp.seconds * 1000).toLocaleString()
        }
        return ''
      }
      
      // Navegar a la vista de detalle del turno (Ventas)
      const viewTurnDetail = (turn) => {
        router.push({ name: 'AdminTurnSalesSummary', params: { turnId: turn.turnIdentifier } })
      }
      
      // Función para abrir modal de inventario y asignar el turno actual
      const openInventoryModal = (turn) => {
        currentTurn.value = turn
        inventoryModal.value = new bootstrap.Modal(document.getElementById('inventoryModal'))
        inventoryModal.value.show()
      }
      
      const closeInventoryModal = () => {
        if (inventoryModal.value) {
          inventoryModal.value.hide()
        }
      }
      
      // Función para abrir modal de domicilios (reporte de pedidos a domicilio) para el turno actual
      const openDomiciliosModal = async (turn) => {
        currentTurn.value = turn
        // Consultar las facturas de domicilios del turno actual
        const invoicesCol = collection(db, 'businesses', businessId, 'invoices')
        const q = query(invoicesCol, where('orderType', '==', 'delivery'), where('turnId', '==', turn.turnIdentifier))
        const snap = await getDocs(q)
        domicilios.value = snap.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            paymentMethodDisplay:
              data.paymentMethod === 'cash'
                ? 'Efectivo'
                : data.paymentMethod === 'qr'
                ? 'QR / Transferencia'
                : 'Domicilio'
          }
        })
        // Abrir el modal de domicilios
        domiciliosModal.value = new bootstrap.Modal(document.getElementById('domiciliosModal'))
        domiciliosModal.value.show()
      }
      
      const closeDomiciliosModal = () => {
        if (domiciliosModal.value) {
          domiciliosModal.value.hide()
        }
      }
      
      // Computed: combinar claves de inventoryInitial e inventoryFinal en una sola lista
      const combinedProducts = computed(() => {
        const initial = currentTurn.value.inventoryInitial || {}
        const final = currentTurn.value.inventoryFinal || {}
        const keys = new Set([...Object.keys(initial), ...Object.keys(final)])
        return Array.from(keys).map(prodId => ({
          prodId,
          initial: Number(initial[prodId] || 0),
          final: Number(final[prodId] || 0)
        }))
      })
      
      // Función para obtener el nombre real del producto consultando allProducts
      const getProductName = (prodId) => {
        const product = allProducts.value.find(p => p.id === prodId)
        return product ? product.name : prodId
      }
      
      onMounted(async () => {
        await fetchProducts()
        await fetchTurns()
      })
      
      return {
        turns,
        currentTurn,
        formatDate,
        viewTurnDetail,
        openInventoryModal,
        closeInventoryModal,
        openDomiciliosModal,
        closeDomiciliosModal,
        combinedProducts,
        getProductName,
        domicilios,
        businessInfo
      }
    }
  }
  </script>
  
  <style scoped>
  .table {
    margin-bottom: 1rem;
  }
  </style>
  