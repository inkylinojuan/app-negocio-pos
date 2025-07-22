<template>
    <div class="container mt-5">
      <h2>Detalle del Turno</h2>
      <div v-if="turn">
        <p><strong>ID:</strong> {{ turn.id }}</p>
        <p><strong>Abierto por:</strong> {{ turn.openedBy }}</p>
        <p><strong>Asignado a:</strong> {{ turn.assignedTo }}</p>
        <p><strong>Estado:</strong> {{ turn.status }}</p>
        <p>
          <strong>Fecha Apertura:</strong>
          {{ turn.openedAt ? new Date(turn.openedAt.seconds * 1000).toLocaleString() : '' }}
        </p>
        <div v-if="turn.status === 'open'">
          <!-- Solo el operario asignado podrá cerrar su turno (o el admin podrá hacerlo) -->
          <button 
            class="btn btn-danger mt-3" 
            @click="closeTurn" 
            :disabled="isOperative && (currentUserUid !== turn.assignedTo)">
            Cerrar Turno
          </button>
          <p v-if="isOperative && (currentUserUid !== turn.assignedTo)" class="text-warning">
            Solo el operario asignado puede cerrar este turno.
          </p>
        </div>
        <div v-else>
          <p>
            <strong>Fecha Cierre:</strong>
            {{ turn.closedAt ? new Date(turn.closedAt.seconds * 1000).toLocaleString() : '' }}
          </p>
          <h4>Resumen del Turno</h4>
          <!-- Aquí podrías mostrar el inventario, ventas, gastos, etc. -->
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
  import { db, auth } from '../firebase'
  
  export default {
    name: 'TurnDetail',
    setup() {
      const route = useRoute()
      const turnId = route.params.id
      const turn = ref(null)
      const currentUserUid = auth.currentUser ? auth.currentUser.uid : ''
      // Obtener el rol actual (se asume que se guardó en localStorage)
      const isOperative = localStorage.getItem('userRole') === 'operative'
      const businessId = localStorage.getItem('businessId') || ''
  
      const fetchTurn = async () => {
        const docRef = doc(db, 'businesses', businessId, 'turns', turnId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          turn.value = { id: docSnap.id, ...docSnap.data() }
        }
      }
  
      const closeTurn = async () => {
        if (!turn.value) return
        const docRef = doc(db, 'businesses', businessId, 'turns', turnId)
        await updateDoc(docRef, {
          status: 'closed',
          closedAt: serverTimestamp()
        })
        await fetchTurn()
      }
  
      onMounted(() => {
        fetchTurn()
      })
  
      return {
        turn,
        closeTurn,
        currentUserUid,
        isOperative
      }
    }
  }
  </script>
  