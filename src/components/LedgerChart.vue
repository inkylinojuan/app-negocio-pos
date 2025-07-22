<template>
    <div class="chart-container">
      <canvas id="ledgerChart"></canvas>
    </div>
  </template>
  
  <script>
  import { onMounted, watch } from 'vue'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)
  
  export default {
    name: 'LedgerChart',
    props: {
      totalIncomes: {
        type: Number,
        required: true
      },
      totalExpenses: {
        type: Number,
        required: true
      },
      operationalProfit: {
        type: Number,
        required: true
      }
    },
    setup(props) {
      let chartInstance = null
  
      const createChart = () => {
        const ctx = document.getElementById('ledgerChart').getContext('2d')
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Ingresos', 'Egresos', 'Utilidad'],
            datasets: [{
              label: 'Totales',
              data: [props.totalIncomes, props.totalExpenses, props.operationalProfit],
              backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        })
      }
  
      onMounted(() => {
        createChart();
      })
  
      // Watch para actualizar el gráfico cuando cambian los totales
      watch(
        () => [props.totalIncomes, props.totalExpenses, props.operationalProfit],
        (newValues) => {
          if (chartInstance) {
            chartInstance.data.datasets[0].data = newValues;
            chartInstance.update();
          }
        }
      )
  
      return {}
    }
  }
  </script>
  
  <style scoped>
  .chart-container {
    height: 400px;
  }
  </style>
  