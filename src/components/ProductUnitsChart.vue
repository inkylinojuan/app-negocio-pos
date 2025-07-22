<!-- src/components/ProductUnitsChart.vue -->
<template>
    <div>
      <canvas ref="unitsChart"></canvas>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)
  
  export default {
    name: 'ProductUnitsChart',
    props: {
      dataProducts: {
        type: Array,
        required: true
      }
    },
    setup(props) {
      const unitsChart = ref(null)
      onMounted(() => {
        const ctx = unitsChart.value.getContext('2d')
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.dataProducts.map(item => item.name),
            datasets: [{
              label: 'Unidades Vendidas',
              data: props.dataProducts.map(item => item.totalUnits)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        })
      })
      return { unitsChart }
    }
  }
  </script>
  