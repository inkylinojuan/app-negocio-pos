<!-- src/pages/TurnCierre.vue -->
<template>
    <div class="container mt-5">
      <h2>Cierre de Turno</h2>
      <div v-if="turn">
        <h4>Inventario Inicial</h4>
        <ul>
          <li v-for="(initial, productId) in turn.inventoryInitial" :key="productId">
            {{ getProductName(productId) }}: {{ initial }}
          </li>
        </ul>
        <h4 class="mt-4">Registrar Inventario Final</h4>
        <form @submit.prevent="closeTurn">
          <div
            v-for="(initial, productId) in turn.inventoryInitial"
            :key="productId"
            class="mb-3"
          >
            <label>{{ getProductName(productId) }} (Inicial: {{ initial }})</label>
            <input
              type="number"
              class="form-control"
              v-model.number="inventoryFinal[productId]"
              min="0"
              placeholder="Cantidad final"
            />
          </div>
          <button type="submit" class="btn btn-danger">Cerrar Turno</button>
        </form>
        <div v-if="summaryCalculated" class="mt-4">
          <h4>Resumen del Turno</h4>
          <ul>
            <li
              v-for="(initial, productId) in turn.inventoryInitial"
              :key="productId"
            >
              {{ getProductName(productId) }}: Vendido {{ initial - inventoryFinal[productId] }} unidades
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
  import { db } from '../firebase'
  import { collection, getDocs } from 'firebase/firestore'
  import { useRoute } from 'vue-router'
  
  export default {
    name: 'TurnCierre',
    setup() {
      const route = useRoute()
      const turnId = route.params.id
      const turn = ref(null)
      const inventoryFinal = ref({})
      const products = ref([])
      const summaryCalculated = ref(false)
      const businessId = localStorage.getItem('businessId') || ''
  
      const fetchTurn = async () => {
        const docRef = doc(db, 'businesses', businessId, 'turns', turnId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          turn.value = { id: docSnap.id, ...docSnap.data() }
          // Inicializa inventoryFinal con valores por defecto (0) si no hay datos previos
          for (const productId in turn.value.inventoryInitial) {
            inventoryFinal.value[productId] =
              turn.value.inventoryFinal[productId] || 0
          }
        }
      }
  
      const fetchProducts = async () => {
        const productsCol = collection(db, 'businesses', businessId, 'products')
        const snap = await getDocs(productsCol)
        products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
  
      const getProductName = (productId) => {
        const prod = products.value.find(p => p.id === productId)
        return prod ? prod.name : productId
      }
  
      const closeTurn = async () => {
        // Validar que el inventario final no sea mayor que el inventario inicial
        for (const productId in turn.value.inventoryInitial) {
          if (inventoryFinal.value[productId] > turn.value.inventoryInitial[productId]) {
            alert(`Error: El inventario final para ${getProductName(productId)} no puede ser mayor que el inicial.`)
            return
          }
        }
        const docRef = doc(db, 'businesses', businessId, 'turns', turnId)
        await updateDoc(docRef, {
          inventoryFinal: { ...inventoryFinal.value },
          status: 'closed',
          closedAt: serverTimestamp()
        })
        summaryCalculated.value = true
        // Opcional: mostrar mensaje de éxito o redirigir
      }
  
      onMounted(() => {
        fetchTurn()
        fetchProducts()
      })
  
      return {
        turn,
        inventoryFinal,
        getProductName,
        closeTurn,
        summaryCalculated
      }
    }
  }
  </script>
  