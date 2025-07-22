<template>
    <div class="container mt-5">
      <h2>Registrar Gasto (Operativo)</h2>
      <form @submit.prevent="addExpense" class="row g-3">
        <!-- Campo para buscar producto (opcional) -->
        <div class="col-md-4">
          <label class="form-label">Buscar Producto (opcional):</label>
          <input
            v-model="newExpense.productSearch"
            type="text"
            class="form-control"
            placeholder="Nombre del producto para Inventario"
          />
          <!-- Lista de sugerencias -->
          <ul v-if="filteredProducts.length" class="list-group mt-2">
            <li
              v-for="prod in filteredProducts"
              :key="prod.id"
              class="list-group-item list-group-item-action"
              @click="selectProduct(prod)"
              style="cursor: pointer;"
            >
              {{ prod.name }}
            </li>
          </ul>
        </div>
        <!-- Campo para ingresar producto manualmente (se muestra si no se seleccionó ninguno) -->
        <div class="col-md-4" v-if="!newExpense.productId">
          <label class="form-label">Producto (ingresar manualmente):</label>
          <input
            v-model="newExpense.manualProduct"
            type="text"
            class="form-control"
            placeholder="Nombre del gasto"
          />
        </div>
        <!-- Campo para cantidad -->
        <div class="col-md-4">
          <label class="form-label">Cantidad</label>
          <input
            v-model.number="newExpense.quantity"
            type="number"
            class="form-control"
            placeholder="Cantidad"
          />
        </div>
        <!-- Campo para valor total -->
        <div class="col-md-4">
          <label class="form-label">Valor Total</label>
          <input
            v-model.number="newExpense.total"
            type="number"
            class="form-control"
            placeholder="Valor total del gasto"
          />
        </div>
        <!-- Campo para descripción -->
        <div class="col-md-6">
          <label class="form-label">Descripción</label>
          <input
            v-model="newExpense.description"
            type="text"
            class="form-control"
            placeholder="Descripción del gasto"
          />
        </div>
        <!-- Botón Agregar -->
        <div class="col-md-2 d-flex align-items-end">
          <button type="submit" class="btn btn-primary">Agregar</button>
        </div>
      </form>
      
      <h3 class="mt-4">Gastos Registrados en el Turno</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto / Gasto</th>
            <th>Cantidad</th>
            <th>Valor Total</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="expense in expenses" :key="expense.id">
            <td>{{ formatDate(expense.createdAt) }}</td>
            <td>{{ expense.productName }}</td>
            <td>{{ expense.quantity }}</td>
            <td>{{ expense.total }}</td>
            <td>{{ expense.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { db } from '../firebase'
  import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp, 
    updateDoc, 
    doc, 
    getDoc 
  } from 'firebase/firestore'
  import { useRoute } from 'vue-router'
  
  export default {
    name: 'OperativeExpenses',
    setup() {
      const route = useRoute()
      const businessId = localStorage.getItem('businessId') || ''
      const turnId = route.params.turnId || localStorage.getItem('currentTurnId') || 'currentTurnId'
      
      // Objeto para el gasto nuevo
      const newExpense = ref({
        productSearch: '',
        productId: '',
        manualProduct: '',
        quantity: 0,
        total: 0,
        description: ''
      })
      
      const expenses = ref([])
      
      // Referencia a la colección de gastos
      const expensesCol = collection(db, 'businesses', businessId, 'expenses')
      
      // Cargar todos los productos para la búsqueda
      const allProducts = ref([])
      const fetchAllProducts = async () => {
        const productsCol = collection(db, 'businesses', businessId, 'products')
        const snap = await getDocs(productsCol)
        allProducts.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
      
      // Computed: filtrar productos según lo ingresado en productSearch
      const filteredProducts = computed(() => {
        if (!newExpense.value.productSearch) return []
        const searchTerm = newExpense.value.productSearch.toLowerCase()
        return allProducts.value.filter(prod => prod.name.toLowerCase().includes(searchTerm))
      })
      
      // Al seleccionar un producto de la lista de sugerencias
      const selectProduct = (prod) => {
        newExpense.value.productId = prod.id
        newExpense.value.productSearch = prod.name
        newExpense.value.manualProduct = '' // Limpiar el campo manual
      }
      
      // Cargar gastos registrados para el turno actual
      const fetchExpenses = async () => {
        const q = query(expensesCol, where('turnId', '==', turnId))
        const snap = await getDocs(q)
        expenses.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
      
      // Función para agregar un gasto y actualizar inventario si aplica
      const addExpense = async () => {
        // Validar campos
        if (
          ((!newExpense.value.productId && !newExpense.value.manualProduct) ||
           newExpense.value.quantity <= 0 ||
           newExpense.value.total <= 0 ||
           !newExpense.value.description)
        ) {
          alert("Complete todos los campos requeridos y asegúrese de que la cantidad y el valor sean mayores que 0.")
          return
        }
        
        const productName = newExpense.value.productId 
          ? (allProducts.value.find(p => p.id === newExpense.value.productId)?.name || newExpense.value.productSearch)
          : newExpense.value.manualProduct
        
        await addDoc(expensesCol, {
          turnId,
          productId: newExpense.value.productId,
          productName,  // Guardamos el nombre del producto o gasto
          quantity: newExpense.value.quantity,
          total: newExpense.value.total,
          description: newExpense.value.description,
          createdAt: serverTimestamp()
        })
        
        // Si se seleccionó un producto para control de inventario, actualizar stock
        if (newExpense.value.productId) {
          const prodDoc = doc(db, 'businesses', businessId, 'products', newExpense.value.productId)
          const productSnap = await getDoc(prodDoc)
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0
            const newStock = currentStock + newExpense.value.quantity
            await updateDoc(prodDoc, { stock: newStock })
          }
        }
        
        // Reiniciar formulario
        newExpense.value = {
          productSearch: '',
          productId: '',
          manualProduct: '',
          quantity: 0,
          total: 0,
          description: ''
        }
        
        // Actualizar lista de gastos
        fetchExpenses()
      }
      
      // Función para formatear fecha
      const formatDate = (timestamp) => {
        if (timestamp && timestamp.seconds) {
          return new Date(timestamp.seconds * 1000).toLocaleString()
        }
        return ''
      }
      
      onMounted(async () => {
        await fetchAllProducts()
        fetchExpenses()
      })
      
      return {
        newExpense,
        expenses,
        addExpense,
        formatDate,
        filteredProducts,
        selectProduct
      }
    }
  }
  </script>
  
  <style scoped>
  .container {
    max-width: 100%;
  }
  .table {
    margin-top: 1rem;
  }
  .list-group {
    max-height: 200px;
    overflow-y: auto;
  }
  </style>
  