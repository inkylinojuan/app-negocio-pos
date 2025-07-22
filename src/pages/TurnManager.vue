<template>
  <div class="container mt-5">
    <h2>Gestión de Turno</h2>
    <div v-if="loading">
      <p>Cargando información...</p>
    </div>
    <div v-else>
      <!-- Si no hay turno abierto, mostrar formulario para abrir turno -->
      <div v-if="!openTurn">
        <h3>Abrir Turno</h3>
        <template v-if="turnType === 'unicoConInventario'">
          <!-- Formulario detallado para inventario -->
          <form @submit.prevent="openNewTurn">
            <div v-for="product in products" :key="product.id" class="mb-3">
              <label>
                {{ product.name }} (Stock actual: {{ product.stock }})
              </label>
              <input
                type="number"
                class="form-control"
                v-model.number="inventoryInitial[product.id]"
                min="0"
                placeholder="Cantidad inicial"
              />
            </div>
            <!-- Campo para registrar novedad en el inventario -->
            <div class="form-group mb-3">
              <label for="inventoryNote">Novedad en Inventario</label>
              <input
                type="text"
                id="inventoryNote"
                v-model="inventoryNote"
                placeholder="Ingrese cualquier novedad del inventario"
                class="form-control"
              />
            </div>
            <button type="submit" class="btn btn-primary">
              Abrir Turno
            </button>
          </form>
        </template>
        <template v-else>
          <!-- Modo minimal: solo botón para abrir turno -->
          <button class="btn btn-primary" @click="openNewTurnMinimal">
            Abrir Turno
          </button>
        </template>
      </div>
      <!-- Si hay turno abierto, mostrar información -->
      <div v-else>
        <h3>Turno Abierto</h3>
        <p>
          Iniciado el:
          {{ openTurn.openedAt ? new Date(openTurn.openedAt.seconds * 1000).toLocaleString() : '' }}
        </p>
        <p>
          Identificador del Turno: <strong>{{ openTurn.turnIdentifier }}</strong>
        </p>
        <template v-if="turnType === 'unicoConInventario'">
          <!-- Vista detallada para cierre de turno -->
          <h4>Cierre de Turno</h4>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Inventario Inicial</th>
                <th>Inventario Final</th>
                <th>Cantidad Vendida</th>
                <th>Valor del Producto</th>
                <th>Venta Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>{{ product.name }}</td>
                <td>{{ openTurn.inventoryInitial[product.id] }}</td>
                <td>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="inventoryFinal[product.id]"
                    min="0"
                  />
                </td>
                <td>{{ soldQuantity(product.id) }}</td>
                <td>{{ product.priceSale }}</td>
                <td>{{ saleTotal(product.id) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th colspan="5">Total Ventas</th>
                <th>{{ totalSales }}</th>
              </tr>
            </tfoot>
          </table>
        </template>
        <!-- Botón para cerrar turno (visible en ambos modos) -->
        <button class="btn btn-danger" @click="closeTurn">
          Cerrar Turno
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { auth, db } from '../firebase'
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  runTransaction
} from 'firebase/firestore'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'TurnManager',
  setup() {
    const loading = ref(true)
    const openTurn = ref(null)
    const products = ref([])
    const inventoryInitial = ref({})
    const inventoryFinal = ref({})
    const inventoryNote = ref('')
    const turnType = ref('')
    const businessId = localStorage.getItem('businessId') || ''
    const currentUserUid = auth.currentUser ? auth.currentUser.uid : ''
    const authStore = useAuthStore()

    // Consulta la configuración del turno desde el documento del negocio
    const fetchTurnConfig = async () => {
      const businessDocRef = doc(db, 'businesses', businessId)
      const docSnap = await getDoc(businessDocRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Se asume que el campo turnType contiene valores: "unicoConInventario", "unicoSinInventario" o "variadoSinInventario"
        turnType.value = data.turnoConfig.tipo || 'unicoConInventario'
      }
    }

    // Función para obtener los productos
    const fetchProducts = async () => {
      const productsCol = collection(db, 'businesses', businessId, 'products')
      const snap = await getDocs(productsCol)
      products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Inicializa inventoryInitial para cada producto en modo detallado
      products.value.forEach(product => {
        inventoryInitial.value[product.id] = product.stock || 0
      })
    }

    // Función para buscar si hay un turno abierto para el usuario actual
    const fetchOpenTurn = async () => {
      const turnsCol = collection(db, 'businesses', businessId, 'turns')
      const q = query(
        turnsCol,
        where('assignedTo', '==', currentUserUid),
        where('status', '==', 'open')
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        const docData = snap.docs[0].data()
        openTurn.value = { id: snap.docs[0].id, ...docData }
        if (turnType.value === 'unicoConInventario') {
          // Inicializa inventoryFinal con los valores existentes o 0
          for (const productId in openTurn.value.inventoryInitial) {
            inventoryFinal.value[productId] =
              (openTurn.value.inventoryFinal && openTurn.value.inventoryFinal[productId]) || 0
          }
        }
        authStore.setCurrentTurnId(openTurn.value.turnIdentifier)
      } else {
        openTurn.value = null
        authStore.setCurrentTurnId('')
      }
    }

    // Función para obtener el siguiente número de turno (controlado en la base de datos)
    const getNextTurnNumber = async () => {
      const counterDocRef = doc(db, 'businesses', businessId, 'counters', 'turns')
      try {
        const newTurnNumber = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterDocRef)
          if (!counterDoc.exists()) {
            transaction.set(counterDocRef, { counter: 1 })
            return 1
          }
          const currentCounter = counterDoc.data().counter
          const nextCounter = currentCounter + 1
          transaction.update(counterDocRef, { counter: nextCounter })
          return nextCounter
        })
        return newTurnNumber
      } catch (e) {
        console.error("Error al obtener el siguiente número de turno:", e)
        return 0
      }
    }

    // Función para generar el identificador único del turno
    const generateTurnIdentifier = async (operatorName) => {
      const turnNumber = await getNextTurnNumber()
      const formattedNumber = turnNumber.toString().padStart(4, '0')
      const now = new Date()
      const dateTimeStr = now.toISOString().replace(/[-:.TZ]/g, '')
      return `${formattedNumber}-${operatorName}-${dateTimeStr}`
    }

    // Función para abrir turno en modo detallado (unicoConInventario)
    const openNewTurn = async () => {
      const operatorName = localStorage.getItem('fullName') || 'Operario'
      const turnIdentifier = await generateTurnIdentifier(operatorName)
      const turnsCol = collection(db, 'businesses', businessId, 'turns')
      const turnData = {
        inventoryNote: inventoryNote.value,
        assignedTo: currentUserUid,
        openedBy: currentUserUid,
        openedAt: serverTimestamp(),
        status: 'open',
        turnIdentifier,
        inventoryInitial: { ...inventoryInitial.value }
      }
      await addDoc(turnsCol, turnData)
      await fetchOpenTurn()
      authStore.setCurrentTurnId(turnIdentifier)
    }

    // Función para abrir turno en modo minimal (unicoSinInventario o variadoSinInventario)
    const openNewTurnMinimal = async () => {
      const operatorName = localStorage.getItem('fullName') || 'Operario'
      const turnIdentifier = await generateTurnIdentifier(operatorName)
      const turnsCol = collection(db, 'businesses', businessId, 'turns')
      const turnData = {
        assignedTo: currentUserUid,
        openedBy: currentUserUid,
        openedAt: serverTimestamp(),
        status: 'open',
        turnIdentifier,
        // No se incluye inventario inicial en modo minimal
        inventoryInitial: {}
      }
      await addDoc(turnsCol, turnData)
      await fetchOpenTurn()
      authStore.setCurrentTurnId(turnIdentifier)
    }

    // Función para cerrar el turno abierto
    const closeTurn = async () => {
      // Si es modo detallado, validar que el inventario final no sea mayor que el inicial
      if (turnType.value === 'unicoConInventario') {
        for (const productId in openTurn.value.inventoryInitial) {
          if (inventoryFinal.value[productId] > openTurn.value.inventoryInitial[productId]) {
            alert(
              `Error: El inventario final para ${getProductName(productId)} no puede ser mayor que el inicial.`
            )
            return
          }
        }
      }
      const turnDoc = doc(db, 'businesses', businessId, 'turns', openTurn.value.id)
      await updateDoc(turnDoc, {
        inventoryFinal: turnType.value === 'unicoConInventario' ? { ...inventoryFinal.value } : {},
        status: 'closed',
        closedAt: serverTimestamp()
      })
      openTurn.value = null
      authStore.setCurrentTurnId('')
      alert('Turno cerrado actualizado correctamente.')
    }

    // Funciones auxiliares para el cierre del turno
    const soldQuantity = (productId) => {
      const initial = openTurn.value.inventoryInitial[productId] || 0
      const final = inventoryFinal.value[productId] || 0
      return initial - final
    }

    const saleTotal = (productId) => {
      return soldQuantity(productId) * (getProduct(productId)?.priceSale || 0)
    }

    const getProduct = (productId) => {
      return products.value.find(p => p.id === productId)
    }

    const getProductName = (productId) => {
      const prod = getProduct(productId)
      return prod ? prod.name : productId
    }

    const totalSales = computed(() => {
      let total = 0
      for (const product of products.value) {
        total += saleTotal(product.id)
      }
      return total
    })

    onMounted(async () => {
      await fetchTurnConfig()
      await fetchProducts()
      await fetchOpenTurn()
      loading.value = false
    })

    return {
      loading,
      openTurn,
      products,
      inventoryInitial,
      inventoryFinal,
      inventoryNote,
      openNewTurn,
      openNewTurnMinimal,
      closeTurn,
      soldQuantity,
      saleTotal,
      totalSales,
      getProductName,
      turnType
    }
  }
}
</script>

<style scoped>
/* Tus estilos aquí */
.turn-manager {
  /* Estilos específicos para el turno */
}
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
}
</style>
