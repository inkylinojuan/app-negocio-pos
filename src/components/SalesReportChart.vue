<!-- src/components/SalesReportChart.vue -->
<template>
    <div>
      <canvas ref="chartCanvas"></canvas>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)
  
  export default {
    name: 'SalesReportChart',
    props: {
      dataSales: { type: Array, required: true }
    },
    setup(props) {
      const chartCanvas = ref(null)
  
      onMounted(() => {
        const ctx = chartCanvas.value.getContext('2d')
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.dataSales.map(item => item.date),
            datasets: [{
              label: 'Ventas',
              data: props.dataSales.map(item => item.amount)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        })
      })
  
      return { chartCanvas }
    }
  }
  </script>
  