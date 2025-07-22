<!-- src/pages/TurnApertura.vue -->
<template>
    <div class="container mt-5">
      <h2>Apertura de Turno</h2>
      <form @submit.prevent="openTurn">
        <div v-for="product in products" :key="product.id" class="mb-3">
          <label>{{ product.name }} (Stock actual: {{ product.stock }})</label>
          <input
            type="number"
            class="form-control"
            v-model.number="inventoryInitial[product.id]"
            min="0"
            placeholder="Cantidad inicial"
          />
        </div>
        <button type="submit" class="btn btn-primary">Abrir Turno</button>
      </form>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
  import { db, auth } from '../firebase'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'TurnApertura',
    setup() {
      const products = ref([])
      const inventoryInitial = ref({})
      const router = useRouter()
      const turnsCol = collection(db, 'businesses', businessId, 'turns')
      const businessId = localStorage.getItem('businessId') || ''
  
      const fetchProducts = async () => {
        const productsCol = collection(db, 'businesses', businessId, 'products')
        const snap = await getDocs(productsCol)
        products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        // Inicializamos inventoryInitial con los valores actuales de cada producto
        products.value.forEach(product => {
          inventoryInitial.value[product.id] = product.stock || 0
        })
      }
  
      const openTurn = async () => {
        const currentUserUid = auth.currentUser ? auth.currentUser.uid : ''
        const turnData = {
          assignedTo: currentUserUid,  // Para operario, se asigna automáticamente su uid
          openedBy: currentUserUid,
          openedAt: serverTimestamp(),
          status: 'open',
          inventoryInitial: { ...inventoryInitial.value },
          // Inicialmente, inventoryFinal se deja vacío hasta el cierre
          inventoryFinal: {}
        }
        const docRef = await addDoc(turnsCol, turnData)
        // Redirige al operario a la vista de cierre para que, al finalizar, ingrese el inventario final
        router.push(`/operative/turnes/${docRef.id}/cerrar`)
      }
  
      onMounted(() => {
        fetchProducts()
      })
  
      return {
        products,
        inventoryInitial,
        openTurn
      }
    }
  }
  </script>
  