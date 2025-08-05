<template>
  <div class="chart-container">
    <h6 class="chart-title">Ventas por Hora del Turno</h6>
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const chartRef = ref(null)
let chart = null

const processData = (invoices) => {
  const hourlyData = new Array(24).fill(0)
  
  invoices.forEach(invoice => {
    if (invoice.createdAt) {
      const date = invoice.createdAt.seconds ? 
        new Date(invoice.createdAt.seconds * 1000) : 
        new Date(invoice.createdAt)
      const hour = date.getHours()
      hourlyData[hour] += invoice.total || 0
    }
  })
  
  return hourlyData
}

const createChart = () => {
  if (chart) {
    chart.destroy()
  }

  const ctx = chartRef.value.getContext('2d')
  const hourlyData = processData(props.data)
  
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Ventas ($)',
        data: hourlyData,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString()
            }
          }
        },
        x: {
          ticks: {
            maxTicksLimit: 12
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Ventas: $${context.parsed.y.toLocaleString()}`
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