<!-- src/pages/Reports.vue -->
<template>
  <div>
    <h1>Reportes</h1>
    <!-- Filtros de fecha -->
    <div>
      <label>Fecha de inicio:</label>
      <input type="date" v-model="startDate" />
      <label>Fecha de fin:</label>
      <input type="date" v-model="endDate" />
      <button @click="fetchReportData">Generar Reporte</button>
    </div>

    <!-- Gráfico de ventas diarias -->
    <div v-if="salesData.length > 0">
      <h2>Ventas Diarias</h2>
      <SalesReportChart :dataSales="salesData" />
    </div>

    <!-- Gráfico de unidades vendidas por producto -->
    <div v-if="productData.length > 0">
      <h2>Unidades Vendidas por Producto</h2>
      <ProductUnitsChart :dataProducts="productData" />
    </div>

    <!-- Gráfico de ingresos por producto -->
    <div v-if="productData.length > 0">
      <h2>Ingresos por Producto</h2>
      <ProductRevenueChart :dataProducts="productData" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import SalesReportChart from '../components/SalesReportChart.vue'
import ProductUnitsChart from '../components/ProductUnitsChart.vue'
import ProductRevenueChart from '../components/ProductRevenueChart.vue'
import { useReports } from '../composables/useReports'

export default {
  name: 'Reports',
  components: { SalesReportChart, ProductUnitsChart, ProductRevenueChart },
  setup() {
    // Reemplaza con el businessId correcto, puede venir desde el estado de autenticación o configuración.
    const businessId = localStorage.getItem('businessId') || ''
    const startDate = ref('')
    const endDate = ref('')
    const salesData = ref([])
    const productData = ref([])

    // Importamos las funciones del composable useReports
    const { fetchSalesData, fetchProductSalesData } = useReports(businessId)

    const fetchReportData = async () => {
      // Obtenemos la agregación diaria de ventas
      salesData.value = await fetchSalesData(startDate.value, endDate.value)
      // Obtenemos la agregación de ventas por producto (unidades e ingresos)
      productData.value = await fetchProductSalesData(startDate.value, endDate.value)
      console.log('Sales Data: ', salesData.value)
      console.log('Product Data: ', productData.value)
    }

    return { startDate, endDate, salesData, productData, fetchReportData }
  }
}
</script>
