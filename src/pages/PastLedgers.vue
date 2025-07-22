<template>
    <div class="container mt-5">
      <h2>Histórico de Libros Diarios</h2>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Identificador</th>
            <th>Fecha Apertura</th>
            <th>Fecha Cierre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ledger in pastLedgers" :key="ledger.id">
            <td>{{ ledger.id }}</td>
            <td>{{ formatDate(ledger.openedAt) }}</td>
            <td>{{ formatDate(ledger.closedAt) }}</td>
            <td>
              <button class="btn btn-info btn-sm" @click="viewLedgerDetail(ledger)">
                Ver Detalle
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { collection, query, where, getDocs } from 'firebase/firestore'
  import { db } from '../firebase'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'PastLedgers',
    setup() {
      const pastLedgers = ref([])
      const router = useRouter()
      const businessId = localStorage.getItem('businessId') || ''
      
      // Función para cargar los libros diarios cerrados
      const fetchPastLedgers = async () => {
        const ledgerCol = collection(db, 'businesses', businessId, 'libroDiario')
        // Consulta: traer solo los libros diarios que tengan closedAt definido.
        const q = query(ledgerCol, where('closedAt', '!=', null))
        const snap = await getDocs(q)
        pastLedgers.value = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
      
      // Función para formatear un timestamp
      const formatDate = (timestamp) => {
        if (timestamp && timestamp.seconds) {
          return new Date(timestamp.seconds * 1000).toLocaleString()
        }
        return ''
      }
      
      // Función para ver el detalle del libro diario seleccionado
      const viewLedgerDetail = (ledger) => {
        // Por ejemplo, redirigir a una vista de detalle
        router.push({ name: 'AdminLedgerDetail', params: { ledgerId: ledger.id } })
      }
      
      onMounted(() => {
        fetchPastLedgers()
      })
      
      return {
        pastLedgers,
        formatDate,
        viewLedgerDetail
      }
    }
  }
  </script>
  
  <style scoped>
  .table {
    margin-top: 1rem;
  }
  </style>
  