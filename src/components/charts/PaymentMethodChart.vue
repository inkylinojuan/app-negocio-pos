<template>
  <div class="chart-container">
    <h6 class="chart-title">Distribución por Método de Pago</h6>
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const chartRef = ref(null)
let chart = null

const createChart = () => {
  if (chart) {
    chart.destroy()
  }

  const ctx = chartRef.value.getContext('2d')
  
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Efectivo', 'QR/Transferencia', 'Domicilio'],
      datasets: [{
        data: [
          props.data.cash || 0,
          props.data.qr || 0,
          props.data.delivery || 0
        ],
        backgroundColor: [
          '#28a745', // Verde para efectivo
          '#007bff', // Azul para QR
          '#ffc107'  // Amarillo para domicilio
        ],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: $${value.toLocaleString()} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-title {
  text-align: center;
  margin-bottom: 1rem;
  color: #495057;
  font-weight: 600;
}
</style> 