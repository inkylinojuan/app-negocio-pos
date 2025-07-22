<template>
    <div class="expense-types-crud">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h4 class="mb-0">Administrar Tipos de Gastos</h4>
        </div>
        <div class="card-body">
          <!-- Formulario para agregar/editar -->
          <form @submit.prevent="saveExpenseType" class="mb-4">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nombre del Tipo de Gasto</label>
                <input
                  v-model="currentExpenseType.name"
                  type="text"
                  class="form-control"
                  placeholder="Ej: Alimentación, Transporte, etc."
                  required
                />
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <button type="submit" class="btn btn-primary me-2">
                  {{ isEditing ? 'Actualizar' : 'Agregar' }}
                </button>
                <button
                  v-if="isEditing"
                  @click="cancelEdit"
                  type="button"
                  class="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
  
          <!-- Tabla de tipos de gastos -->
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="type in expenseTypes" :key="type.id">
                  <td>{{ type.name }}</td>
                  <td>
                    <button
                      @click="editExpenseType(type)"
                      class="btn btn-sm btn-warning me-2"
                    >
                      Editar
                    </button>
                    <button
                      @click="confirmDelete(type)"
                      class="btn btn-sm btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
                <tr v-if="expenseTypes.length === 0">
                  <td colspan="2" class="text-center text-muted">
                    No hay tipos de gastos registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { db } from '../firebase'
  import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
  
  export default {
    name: 'ExpenseTypesCRUD',
    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      const expenseTypes = ref([])
      const currentExpenseType = ref({
        id: '',
        name: ''
      })
      const isEditing = ref(false)
  
      // Referencia a la colección
      const expenseTypesCol = collection(db, 'businesses', businessId, 'expenseTypes')
  
      // Cargar tipos de gasto
      const fetchExpenseTypes = async () => {
        const snapshot = await getDocs(expenseTypesCol)
        expenseTypes.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
  
      // Guardar o actualizar
      const saveExpenseType = async () => {
        try {
          if (isEditing.value) {
            const docRef = doc(db, 'businesses', businessId, 'expenseTypes', currentExpenseType.value.id)
            await updateDoc(docRef, { name: currentExpenseType.value.name })
          } else {
            await addDoc(expenseTypesCol, {
              name: currentExpenseType.value.name
            })
          }
          resetForm()
          await fetchExpenseTypes()
        } catch (error) {
          console.error('Error al guardar tipo de gasto:', error)
          alert('Ocurrió un error al guardar')
        }
      }
  
      // Editar
      const editExpenseType = (type) => {
        currentExpenseType.value = { ...type }
        isEditing.value = true
      }
  
      // Cancelar edición
      const cancelEdit = () => {
        resetForm()
      }
  
      // Confirmar eliminación
      const confirmDelete = async (type) => {
        if (confirm(`¿Estás seguro de eliminar el tipo de gasto "${type.name}"?`)) {
          await deleteExpenseType(type.id)
        }
      }
  
      // Eliminar
      const deleteExpenseType = async (id) => {
        try {
          await deleteDoc(doc(db, 'businesses', businessId, 'expenseTypes', id))
          await fetchExpenseTypes()
        } catch (error) {
          console.error('Error al eliminar tipo de gasto:', error)
          alert('Ocurrió un error al eliminar')
        }
      }
  
      // Resetear formulario
      const resetForm = () => {
        currentExpenseType.value = {
          id: '',
          name: ''
        }
        isEditing.value = false
      }
  
      onMounted(() => {
        fetchExpenseTypes()
      })
  
      return {
        expenseTypes,
        currentExpenseType,
        isEditing,
        saveExpenseType,
        editExpenseType,
        cancelEdit,
        confirmDelete
      }
    }
  }
  </script>
  
  <style scoped>
  .expense-types-crud {
    max-width: 800px;
    margin: 0 auto;
  }
  </style>