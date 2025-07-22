<template>
    <div class="expense-categories-crud">
      <div class="card">
        <div class="card-header bg-success text-white">
          <h4 class="mb-0">Administrar Categorías de Gastos</h4>
        </div>
        <div class="card-body">
          <!-- Formulario para agregar/editar -->
          <form @submit.prevent="saveCategory" class="mb-4">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nombre de la Categoría</label>
                <input
                  v-model="currentCategory.name"
                  type="text"
                  class="form-control"
                  placeholder="Ej: Operativos, Administrativos, etc."
                  required
                />
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <button type="submit" class="btn btn-success me-2">
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
  
          <!-- Tabla de categorías -->
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="category in categories" :key="category.id">
                  <td>{{ category.name }}</td>
                  <td>
                    <button
                      @click="editCategory(category)"
                      class="btn btn-sm btn-warning me-2"
                    >
                      Editar
                    </button>
                    <button
                      @click="confirmDelete(category)"
                      class="btn btn-sm btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
                <tr v-if="categories.length === 0">
                  <td colspan="2" class="text-center text-muted">
                    No hay categorías registradas
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
    name: 'ExpenseCategoriesCRUD',
    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      const categories = ref([])
      const currentCategory = ref({
        id: '',
        name: ''
      })
      const isEditing = ref(false)
  
      // Referencia a la colección
      const categoriesCol = collection(db, 'businesses', businessId, 'expenseCategories')
  
      // Cargar categorías
      const fetchCategories = async () => {
        const snapshot = await getDocs(categoriesCol)
        categories.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
  
      // Guardar o actualizar
      const saveCategory = async () => {
        try {
          if (isEditing.value) {
            const docRef = doc(db, 'businesses', businessId, 'expenseCategories', currentCategory.value.id)
            await updateDoc(docRef, { name: currentCategory.value.name })
          } else {
            await addDoc(categoriesCol, {
              name: currentCategory.value.name
            })
          }
          resetForm()
          await fetchCategories()
        } catch (error) {
          console.error('Error al guardar categoría:', error)
          alert('Ocurrió un error al guardar')
        }
      }
  
      // Editar
      const editCategory = (category) => {
        currentCategory.value = { ...category }
        isEditing.value = true
      }
  
      // Cancelar edición
      const cancelEdit = () => {
        resetForm()
      }
  
      // Confirmar eliminación
      const confirmDelete = async (category) => {
        if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
          await deleteCategory(category.id)
        }
      }
  
      // Eliminar
      const deleteCategory = async (id) => {
        try {
          await deleteDoc(doc(db, 'businesses', businessId, 'expenseCategories', id))
          await fetchCategories()
        } catch (error) {
          console.error('Error al eliminar categoría:', error)
          alert('Ocurrió un error al eliminar')
        }
      }
  
      // Resetear formulario
      const resetForm = () => {
        currentCategory.value = {
          id: '',
          name: ''
        }
        isEditing.value = false
      }
  
      onMounted(() => {
        fetchCategories()
      })
  
      return {
        categories,
        currentCategory,
        isEditing,
        saveCategory,
        editCategory,
        cancelEdit,
        confirmDelete
      }
    }
  }
  </script>
  
  <style scoped>
  .expense-categories-crud {
    max-width: 800px;
    margin: 0 auto;
  }
  </style>