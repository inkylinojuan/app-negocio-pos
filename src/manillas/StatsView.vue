<template>
    <div class="container py-4">
      <h2 class="mb-4">Informe de Lecturas UHF</h2>
  
      <!-- Gráfico de barras: top EPCs -->
      <div class="card mb-5">
        <div class="card-body">
          <Bar :data="barData" :options="barOptions" />
        </div>
      </div>
  
      <!-- Selección de EPC y curva en el tiempo -->
      <div class="card">
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <label>Selecciona un tag (EPC):</label>
              <select class="form-select" v-model="selectedEpc">
                <option v-for="item in epcList" :key="item.epc" :value="item.epc">
                  {{ item.epc }} ({{ item.count }} lecturas)
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label>Intervalo de tiempo:</label>
              <input type="datetime-local" v-model="start" class="form-control" />
              <input type="datetime-local" v-model="end"   class="form-control mt-2" />
            </div>
          </div>
          <Line :data="lineData" :options="lineOptions" />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import { collection, getDocs, query, where } from 'firebase/firestore'
  import { db } from '../firebase.js'
  
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js'
  import { Bar, Line } from 'vue-chartjs'
  
  // Registrar en Chart.js
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )
  
  // Reactivos para totales
  const epcList    = ref([])
  const barData    = ref({ labels: [], datasets: [] })
  const barOptions = ref({
    responsive: true,
    plugins: { legend: { display: false } }
  })
  
  // Reactivos para curva
  const selectedEpc = ref(null)
  const start       = ref(new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0,16))
  const end         = ref(new Date().toISOString().slice(0,16))
  const lineData    = ref({ labels: [], datasets: [] })
  const lineOptions = ref({
    responsive: true,
    plugins: { legend: { display: false } }
  })
  
  // Carga totales por EPC
  async function loadTotals() {
    const snap = await getDocs(collection(db, 'UHF'))
    const counts = {}
    snap.forEach(doc => {
      const { epc } = doc.data()
      counts[epc] = (counts[epc] || 0) + 1
    })
    const arr = Object.entries(counts)
      .map(([epc, count]) => ({ epc, count }))
      .sort((a,b) => b.count - a.count)
  
    epcList.value = arr
    barData.value = {
      labels: arr.map(i => i.epc),
      datasets: [{ label: 'Lecturas', data: arr.map(i => i.count) }]
    }
  }
  
  // Carga curva de lecturas por hora para el EPC seleccionado
  async function loadCurve() {
    if (!selectedEpc.value) return
    const tsStart = new Date(start.value)
    const tsEnd   = new Date(end.value)
    const q = query(
      collection(db, 'UHF'),
      where('epc', '==', selectedEpc.value),
      where('timestamp', '>=', tsStart),
      where('timestamp', '<=', tsEnd),
    )
    const snap = await getDocs(q)
    const buckets = {}
    snap.forEach(doc => {
      const dt = doc.data().timestamp.toDate()
      const hour = dt.getHours().toString().padStart(2,'0') + ':00'
      buckets[hour] = (buckets[hour] || 0) + 1
    })
    const labels = Object.keys(buckets).sort()
    lineData.value = {
      labels,
      datasets: [{ label: 'Lecturas por hora', data: labels.map(h => buckets[h]) }]
    }
  }
  
  onMounted(loadTotals)
  watch([selectedEpc, start, end], loadCurve)
  </script>
  
  <style scoped>
  .card { border-radius: .5rem; }
  </style>
  