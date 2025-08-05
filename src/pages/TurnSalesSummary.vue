<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">Resumen de Ventas del Turno</h2>
        <p class="text-muted mb-0">
          Turno: <strong>{{ turnId }}</strong>
        </p>
      </div>
      <div class="btn-group" role="group">
        <button 
          class="btn btn-outline-primary" 
          :class="{ 'active': viewMode === 'dashboard' }"
          @click="viewMode = 'dashboard'"
        >
          <i class="bi bi-graph-up"></i> Dashboard
        </button>
        <button 
          class="btn btn-outline-primary" 
          :class="{ 'active': viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          <i class="bi bi-table"></i> Tabla
        </button>
      </div>
    </div>

    <!-- Dashboard View -->
    <div v-if="viewMode === 'dashboard'" class="dashboard-view">
      <!-- Métricas Principales -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <MetricCard
            :value="totalGeneralSales"
            label="Total de Ventas"
            subtitle="Del turno completo"
            icon="bi bi-currency-dollar"
            color="success"
            format="currency"
          />
        </div>
        <div class="col-md-3 mb-3">
          <MetricCard
            :value="invoices.length"
            label="Total de Facturas"
            subtitle="Transacciones realizadas"
            icon="bi bi-receipt"
            color="primary"
            format="number"
          />
        </div>
        <div class="col-md-3 mb-3">
          <MetricCard
            :value="averageInvoiceValue"
            label="Promedio por Factura"
            subtitle="Valor promedio"
            icon="bi bi-calculator"
            color="info"
            format="currency"
          />
        </div>
        <div class="col-md-3 mb-3">
          <MetricCard
            :value="highestInvoiceValue"
            label="Factura Más Alta"
            subtitle="Valor máximo"
            icon="bi bi-trophy"
            color="warning"
            format="currency"
          />
        </div>
      </div>

      <!-- Gráficos -->
      <div class="row mb-4">
        <div class="col-md-6 mb-3">
          <PaymentMethodChart :data="paymentMethodData" />
        </div>
        <div class="col-md-6 mb-3">
          <SalesByHourChart :data="invoices" />
        </div>
      </div>

      <!-- Métricas Secundarias -->
      <div class="row mb-4">
        <div class="col-md-4 mb-3">
          <MetricCard
            :value="totalCashSales"
            label="Ventas en Efectivo"
            subtitle="Total acumulado"
            icon="bi bi-cash-coin"
            color="success"
            format="currency"
          />
        </div>
        <div class="col-md-4 mb-3">
          <MetricCard
            :value="totalQRSales"
            label="Ventas QR/Transferencia"
            subtitle="Total acumulado"
            icon="bi bi-phone"
            color="primary"
            format="currency"
          />
        </div>
        <div class="col-md-4 mb-3">
          <MetricCard
            :value="totalDeliverySales"
            label="Ventas Domicilio"
            subtitle="Total acumulado"
            icon="bi bi-truck"
            color="warning"
            format="currency"
          />
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="viewMode === 'table'" class="table-view">
      <!-- Filtros de búsqueda -->
      <div class="row mb-3">
        <div class="col-sm-6">
          <label>Filtrar por Medio de Pago:</label>
          <select v-model="filterPaymentMethod" class="form-select form-select-sm">
            <option value="">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="qr">QR / Transferencia</option>
            <option value="delivery">Domicilio</option>
          </select>
        </div>
        <div class="col-sm-6">
          <label>Filtrar por Tipo de Venta:</label>
          <select v-model="filterSaleType" class="form-select form-select-sm">
            <option value="">Todos</option>
            <option value="directa">Directa</option>
            <option value="mensajeria">Mensajería</option>
          </select>
        </div>
      </div>
      
      <div class="row">
        <!-- Columna Izquierda: Tabla de Facturas -->
        <div class="col-md-8">
          <table class="table table-striped">
            <thead>
              <tr>
                <th @click="sort('invoiceNumber')" style="cursor: pointer;">
                  Número de Factura 
                  <span v-if="sortBy === 'invoiceNumber'">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </th>
                <th @click="sort('total')" style="cursor: pointer;">
                  Monto Total 
                  <span v-if="sortBy === 'total'">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </th>
                <th @click="sort('paymentMethod')" style="cursor: pointer;">
                  Medio de Pago 
                  <span v-if="sortBy === 'paymentMethod'">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </th>
                <th @click="sort('saleType')" style="cursor: pointer;">
                  Tipo de Venta 
                  <span v-if="sortBy === 'saleType'">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in sortedAndFilteredInvoices" :key="invoice.id">
                <td>{{ invoice.invoiceNumber }}</td>
                <td>{{ invoice.total }}</td>
                <td>{{ invoice.paymentMethodDisplay }}</td>
                <td>
                  <span v-if="invoice.paymentMethod === 'delivery'">Mensajería</span>
                  <span v-else>Directa</span>
                </td>
                <td>
                  <button class="btn btn-info btn-sm" @click="viewInvoice(invoice)">
                    Ver Factura
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>      
              <tr>
                <th colspan="5">Totales por Medio de Pago</th>
              </tr>
              <tr>
                <td colspan="2"><strong>Total Ventas Efectivo:</strong></td>
                <td colspan="3">{{ totalCashSales }}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Total Ventas QR/Transferencia:</strong></td>
                <td colspan="3">{{ totalQRSales }}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Total General:</strong></td>
                <td colspan="3">{{ totalGeneralSales }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- Columna Derecha: Vista Previa de la Factura -->
        <div class="col-md-4">
          <div v-if="selectedInvoice && selectedInvoice.id" id="invoicePreview" class="sticky-top" style="top: 20px;">
            <h4>Factura</h4>
            <InvoiceTemplate
              v-if="businessInfo"
              :businessInfo="businessInfo"
              :invoiceNumber="selectedInvoice.invoiceNumber"
              :invoiceDate="formatDate(selectedInvoice.createdAt)"
              :paymentMethod="selectedInvoice.paymentMethod"
              :sellerName="selectedInvoice.sellerName || ''"
              :dueDate="selectedInvoice.dueDate || ''"
              :customer="selectedInvoice.customer || {}"
              :cart="selectedInvoice.cart || []"
              :subtotal="selectedInvoice.subtotal || 0"
              :tax="selectedInvoice.tax || 0"
              :total="selectedInvoice.total || 0"
              :deliveryInfo="selectedInvoice.deliveryInfo || {}"
              :products="products"
            />
            <button class="btn btn-primary mt-3" @click="printInvoice">
              Imprimir Factura
            </button>
          </div>
          <div v-else class="text-center">
            <p>Seleccione una factura para ver su detalle</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import InvoiceTemplate from '../components/InvoiceTemplate.vue'
import MetricCard from '../components/MetricCard.vue'
import PaymentMethodChart from '../components/charts/PaymentMethodChart.vue'
import SalesByHourChart from '../components/charts/SalesByHourChart.vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'TurnSalesSummary',
  components: { 
    InvoiceTemplate, 
    MetricCard, 
    PaymentMethodChart, 
    SalesByHourChart
  },
  setup() {
    const route = useRoute()
    const turnId = route.params.turnId
    const invoices = ref([])
    const selectedInvoice = ref({})
    const businessId = localStorage.getItem('businessId') || ''
    const authStore = useAuthStore()
    const businessInfo = computed(() => authStore.businessInfo)
    
    // Modo de vista (dashboard o tabla)
    const viewMode = ref('dashboard')
    
    // Definir products y cargarlos desde Firestore (similar a SalesPOS)
    const products = ref([])
    const fetchProducts = async () => {
      const productsCol = collection(db, 'businesses', businessId, 'products')
      const snap = await getDocs(productsCol)
      products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
    
    // Filtros de búsqueda
    const filterPaymentMethod = ref('')
    const filterSaleType = ref('')
    
    // Variables para ordenamiento
    const sortBy = ref('invoiceNumber')
    const sortOrder = ref('desc')
    
    // Función para obtener las facturas del turno
    const fetchInvoices = async () => {
      const invoicesCol = collection(db, 'businesses', businessId, 'invoices')
      const q = query(invoicesCol, where('turnId', '==', turnId))
      const snap = await getDocs(q)
      invoices.value = snap.docs.map(doc => {
        const data = doc.data()
        const saleType = data.paymentMethod === 'delivery' ? 'mensajeria' : 'directa'
        return { 
          id: doc.id, 
          ...data,
          paymentMethodDisplay: data.paymentMethod === 'cash' ? 'Efectivo' 
            : data.paymentMethod === 'qr' ? 'QR / Transferencia' 
            : 'Domicilio',
          saleType
        }
      })
    }
    
    onMounted(async () => {
      await fetchProducts()
      await fetchInvoices()
    })
    
    // Computed para filtrar y ordenar las facturas
    const sortedAndFilteredInvoices = computed(() => {
      let filtered = invoices.value.slice()
      if (filterPaymentMethod.value) {
        filtered = filtered.filter(inv => inv.paymentMethod === filterPaymentMethod.value)
      }
      if (filterSaleType.value) {
        filtered = filtered.filter(inv => inv.saleType === filterSaleType.value)
      }
      filtered.sort((a, b) => {
        let fieldA = a[sortBy.value]
        let fieldB = b[sortBy.value]
        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return sortOrder.value === 'asc' ? fieldA - fieldB : fieldB - fieldA
        }
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortOrder.value === 'asc'
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA)
        }
        return 0
      })
      return filtered
    })
    
    // Totales por tipo de venta
    const totalDirectSales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod !== 'delivery')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
    })
    
    const totalDeliverySales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod === 'delivery')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
    })
    
    const totalCashSales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod === 'cash')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
    })
    
    const totalQRSales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod === 'qr')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
    })
    
    const totalGeneralSales = computed(() => totalDirectSales.value + totalDeliverySales.value)
    
    // Métricas adicionales para el dashboard
    const averageInvoiceValue = computed(() => {
      if (invoices.value.length === 0) return 0
      return totalGeneralSales.value / invoices.value.length
    })
    
    const highestInvoiceValue = computed(() => {
      if (invoices.value.length === 0) return 0
      return Math.max(...invoices.value.map(inv => inv.total || 0))
    })
    
    // Datos para el gráfico de métodos de pago
    const paymentMethodData = computed(() => ({
      cash: totalCashSales.value,
      qr: totalQRSales.value,
      delivery: totalDeliverySales.value
    }))
    
    // Función para ordenar al hacer clic en el encabezado
    const sort = (column) => {
      if (sortBy.value === column) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortBy.value = column
        sortOrder.value = 'asc'
      }
    }
    
    // Función para formatear la fecha
    const formatDate = (timestamp) => {
      if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString()
      }
      return ''
    }
    
    // Función para ver factura en vista previa (panel lateral)
    const viewInvoice = (invoice) => {
      selectedInvoice.value = invoice
    }
    
    // Función para imprimir la factura
    const printInvoice = () => {
      const invoiceElement = document.getElementById('invoice')
      if (!invoiceElement) {
        console.error("No se encontró el elemento con id 'invoice'")
        return
      }
      const invoiceContent = invoiceElement.innerHTML
      const printWindow = window.open('', '', 'height=1000,width=800')
      printWindow.document.write('<html><head><title>Factura</title>')
      printWindow.document.write('<style>')
      printWindow.document.write(`
        @page {
          size: 60mm auto;
          margin: 2mm;
        }
        body {
          width: 60mm;
          margin: 0 auto;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 10px;
          margin-top: 20px;
        }
        .invoice-template {
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .header, .invoice-info, .customer-info, .cart-info, .additional-info{
          text-align: center;
          margin: 0.2mm;
          padding: 0;
          line-height: 0.2;
        }
        .footer {
          text-align: center;
          margin: 0.2mm;
          padding: 0;
          line-height: 1.2;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        .table th, .table td {
          border: none;
          padding: 1px;
          text-align: center;
        }
        .totals {
          margin-top: 2mm;
          text-align: right;
          line-height: 1.2;
        }
        hr {
          border: none;
          border-top: 1px solid #000;
          margin: 2mm 0;
        }
      `)
      printWindow.document.write('</style>')
      printWindow.document.write('</head><body>')
      printWindow.document.write(invoiceContent)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    return {
      turnId,
      invoices,
      selectedInvoice,
      products,
      totalDirectSales,
      totalDeliverySales,
      totalCashSales,
      totalQRSales,
      totalGeneralSales,
      averageInvoiceValue,
      highestInvoiceValue,
      paymentMethodData,
      viewMode,
      viewInvoice,
      printInvoice,
      filterPaymentMethod,
      filterSaleType,
      sortedAndFilteredInvoices,
      sort,
      sortBy,
      sortOrder,
      formatDate,
      businessInfo
    }
  }
}
</script>

<style scoped>
.dashboard-view {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.table-view {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-group .btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-view {
    padding: 1rem;
  }
  
  .d-flex.justify-content-between {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn-group {
    width: 100%;
  }
  
  .btn-group .btn {
    flex: 1;
  }
}
</style>
