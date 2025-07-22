<!-- src/components/ProductRevenueChart.vue -->
<template>
    <div>
      <canvas ref="revenueChart"></canvas>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)
  
  export default {
    name: 'ProductRevenueChart',
    props: {
      dataProducts: {
        type: Array,
        required: true
      }
    },
    setup(props) {
      const revenueChart = ref(null)
      onMounted(() => {
        const ctx = revenueChart.value.getContext('2d')
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.dataProducts.map(item => item.name),
            datasets: [{
              label: 'Total Ingresos',
              data: props.dataProducts.map(item => item.totalRevenue)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        })
      })
      return { revenueChart }
    }
  }
  </script>
  