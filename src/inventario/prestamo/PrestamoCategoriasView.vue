<template>
    <MenuInventario/>
    <div class="container py-4">
      <h2>Gestión de Inventario</h2>
  
      <!-- Pestañas de navegación -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a href="#" 
             class="nav-link" 
             :class="{ active: activeTab === 'categories' }"
             @click.prevent="activeTab = 'categories'">
            Categorías de Préstamo
          </a>
        </li>
        <li class="nav-item">
          <a href="#" 
             class="nav-link" 
             :class="{ active: activeTab === 'ubicaciones' }"
             @click.prevent="activeTab = 'ubicaciones'">
            Ubicaciones
          </a>
        </li>
      </ul>
  
      <!-- Pestaña de Categorías de Préstamo -->
      <div v-if="activeTab === 'categories'">
        <h3 class="mb-3">Categorías de Préstamo</h3>
        <!-- Formulario para agregar nueva categoría -->
        <form @submit.prevent="addCategory" class="mb-4 row g-2">
          <div class="col-sm-5">
            <input
              v-model="newCategory.name"
              type="text"
              class="form-control"
              placeholder="Nombre de categoría"
              required
            />
          </div>
          <div class="col-sm-5">
            <input
              v-model="newCategory.code"
              type="text"
              class="form-control"
              placeholder="Código interno (ej. SILL-0001)"
              required
            />
          </div>
          <div class="col-sm-2">
            <button type="submit" class="btn btn-primary w-100">
              Agregar
            </button>
          </div>
        </form>
  
        <!-- Buscador de categorías -->
        <div class="mb-3">
          <input v-model="categorySearchQuery" type="text" class="form-control" placeholder="Buscar categoría..."/>
        </div>
  
        <!-- Tabla de categorías -->
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th @click="sortCategories('name')" class="sortable">
                Nombre
                <span v-if="categorySortBy === 'name'">
                  <i :class="{'bi bi-arrow-up': categorySortDirection === 'asc', 'bi bi-arrow-down': categorySortDirection === 'desc'}"></i>
                </span>
              </th>
              <th @click="sortCategories('code')" class="sortable">
                Código
                <span v-if="categorySortBy === 'code'">
                  <i :class="{'bi bi-arrow-up': categorySortDirection === 'asc', 'bi bi-arrow-down': categorySortDirection === 'desc'}"></i>
                </span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in sortedFilteredCategories" :key="cat.id">
              <td v-if="editCategoryId !== cat.id">{{ cat.name }}</td>
              <td v-else>
                <input v-model="editCategory.name" class="form-control" />
              </td>
  
              <td v-if="editCategoryId !== cat.id">{{ cat.code }}</td>
              <td v-else>
                <input v-model="editCategory.code" class="form-control" />
              </td>
  
              <td>
                <div v-if="editCategoryId !== cat.id">
                  <button class="btn btn-sm btn-outline-secondary me-1" @click="startEditCategory(cat)">
                    Editar
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="showConfirmDeleteCategory(cat.id, cat.name)">
                    Eliminar
                  </button>
                </div>
                <div v-else>
                  <button class="btn btn-sm btn-outline-success me-1" @click="saveEditCategory(cat.id)">
                    Guardar
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="cancelEditCategory">
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="sortedFilteredCategories.length === 0">
              <td colspan="3" class="text-center">No hay categorías para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Pestaña de Ubicaciones -->
      <div v-if="activeTab === 'ubicaciones'">
        <h3 class="mb-3">Ubicaciones</h3>
        <!-- Formulario para agregar nueva ubicación -->
        <form @submit.prevent="addUbicacion" class="mb-4 row g-2">
          <div class="col-sm-5">
            <input
              v-model="newUbicacion.name"
              type="text"
              class="form-control"
              placeholder="Nombre de ubicación"
              required
            />
          </div>
          <div class="col-sm-5">
            <input
              v-model="newUbicacion.code"
              type="text"
              class="form-control"
              placeholder="Código interno (ej. ALM-001)"
              required
            />
          </div>
          <div class="col-sm-2">
            <button type="submit" class="btn btn-primary w-100">
              Agregar
            </button>
          </div>
        </form>
  
        <!-- Buscador de ubicaciones -->
        <div class="mb-3">
          <input v-model="ubicacionSearchQuery" type="text" class="form-control" placeholder="Buscar ubicación..."/>
        </div>
  
        <!-- Tabla de ubicaciones -->
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th @click="sortUbicaciones('name')" class="sortable">
                Nombre
                <span v-if="ubicacionSortBy === 'name'">
                  <i :class="{'bi bi-arrow-up': ubicacionSortDirection === 'asc', 'bi bi-arrow-down': ubicacionSortDirection === 'desc'}"></i>
                </span>
              </th>
              <th @click="sortUbicaciones('code')" class="sortable">
                Código
                <span v-if="ubicacionSortBy === 'code'">
                  <i :class="{'bi bi-arrow-up': ubicacionSortDirection === 'asc', 'bi bi-arrow-down': ubicacionSortDirection === 'desc'}"></i>
                </span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ubi in sortedFilteredUbicaciones" :key="ubi.id">
              <td v-if="editUbicacionId !== ubi.id">{{ ubi.name }}</td>
              <td v-else>
                <input v-model="editUbicacion.name" class="form-control" />
              </td>
  
              <td v-if="editUbicacionId !== ubi.id">{{ ubi.code }}</td>
              <td v-else>
                <input v-model="editUbicacion.code" class="form-control" />
              </td>
  
              <td>
                <div v-if="editUbicacionId !== ubi.id">
                  <button class="btn btn-sm btn-outline-secondary me-1" @click="startEditUbicacion(ubi)">
                    Editar
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="showConfirmDeleteUbicacion(ubi.id, ubi.name)">
                    Eliminar
                  </button>
                </div>
                <div v-else>
                  <button class="btn btn-sm btn-outline-success me-1" @click="saveEditUbicacion(ubi.id)">
                    Guardar
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="cancelEditUbicacion">
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="sortedFilteredUbicaciones.length === 0">
              <td colspan="3" class="text-center">No hay ubicaciones para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Custom Message/Confirmation Modal -->
      <div v-if="showCustomModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ customModalTitle }}</h5>
              <button type="button" class="btn-close" @click="closeCustomModal"></button>
            </div>
            <div class="modal-body">
              <p>{{ customModalMessage }}</p>
              <div v-if="customModalType === 'confirm-text'" class="mt-3">
                <label for="confirmTextInput" class="form-label">Para confirmar, escribe "{{ customModalConfirmText }}"</label>
                <input type="text" id="confirmTextInput" v-model="confirmTextInput" class="form-control" @keyup.enter="handleConfirmText" />
              </div>
            </div>
            <div class="modal-footer">
              <button v-if="customModalType === 'confirm' || customModalType === 'confirm-text'" type="button" class="btn btn-secondary" @click="customModalReject">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="handleConfirmText" :disabled="customModalType === 'confirm-text' && confirmTextInput !== customModalConfirmText">
                {{ customModalType === 'confirm' || customModalType === 'confirm-text' ? 'Aceptar' : 'Cerrar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
  
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue';
  import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    // orderBy, // No se usa para ordenamiento dinámico en cliente
  } from 'firebase/firestore';
  import { db } from '../../firebase';
  import MenuInventario from '../../components/MenuInventario.vue';
  
  export default {
    name: 'ManageInventoryData',
    components: { MenuInventario },
    setup() {
      const businessId = localStorage.getItem('businessId') || '';
  
      // --- Custom Modal Logic ---
      const showCustomModal = ref(false);
      const customModalTitle = ref('');
      const customModalMessage = ref('');
      const customModalType = ref('alert'); // 'alert', 'confirm', 'confirm-text'
      const customModalConfirmText = ref(''); // Text to type for confirm-text
      const confirmTextInput = ref(''); // Input for confirm-text
      let customModalResolve = () => {};
      let customModalReject = () => {};
  
      const openCustomModal = (title, message, type = 'alert', confirmText = '') => {
        customModalTitle.value = title;
        customModalMessage.value = message;
        customModalType.value = type;
        customModalConfirmText.value = confirmText;
        confirmTextInput.value = ''; // Reset input
        showCustomModal.value = true;
        return new Promise((resolve, reject) => {
          customModalResolve = () => {
            showCustomModal.value = false;
            resolve(true);
          };
          customModalReject = () => {
            showCustomModal.value = false;
            resolve(false);
          };
        });
      };
  
      const closeCustomModal = () => {
        showCustomModal.value = false;
        if (customModalType.value === 'alert') {
          customModalResolve();
        } else {
          customModalReject(); // For confirm/confirm-text, cancelling rejects the promise
        }
      };
  
      const handleConfirmText = () => {
        if (customModalType.value === 'confirm-text' && confirmTextInput.value !== customModalConfirmText.value) {
          // Do nothing if text doesn't match for confirm-text type
          return;
        }
        customModalResolve();
      };
  
      // --- Tab Management ---
      const activeTab = ref('categories');
  
      // --- Categories Logic ---
      const categories = ref([]);
      const newCategory = ref({ name: '', code: '' });
      const editCategoryId = ref(null);
      const editCategory = ref({ name: '', code: '' });
      const categorySearchQuery = ref('');
      const categorySortBy = ref('code'); // Default sort
      const categorySortDirection = ref('asc'); // Default direction
  
      const categoriesCol = collection(db, 'businesses', businessId, 'loanCategories');
  
      // Real-time listener for categories
      onMounted(() => {
        onSnapshot(categoriesCol, (snapshot) => {
          categories.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }, (error) => {
          console.error("Error fetching categories:", error);
          openCustomModal('Error', 'No se pudieron cargar las categorías: ' + error.message);
        });
      });
  
      const addCategory = async () => {
        if (!newCategory.value.name || !newCategory.value.code) {
          openCustomModal('Advertencia', 'Por favor, complete todos los campos para la categoría.');
          return;
        }
        try {
          await addDoc(categoriesCol, {
            name: newCategory.value.name,
            code: newCategory.value.code,
            createdAt: new Date(),
          });
          newCategory.value = { name: '', code: '' };
          openCustomModal('Éxito', 'Categoría agregada correctamente.');
        } catch (error) {
          console.error("Error adding category:", error);
          openCustomModal('Error', 'No se pudo agregar la categoría: ' + error.message);
        }
      };
  
      const startEditCategory = (cat) => {
        editCategoryId.value = cat.id;
        editCategory.value = { name: cat.name, code: cat.code };
      };
  
      const saveEditCategory = async (id) => {
        if (!editCategory.value.name || !editCategory.value.code) {
          openCustomModal('Advertencia', 'Por favor, complete todos los campos para editar la categoría.');
          return;
        }
        try {
          const docRef = doc(db, 'businesses', businessId, 'loanCategories', id);
          await updateDoc(docRef, {
            name: editCategory.value.name,
            code: editCategory.value.code,
            updatedAt: new Date(),
          });
          cancelEditCategory();
          openCustomModal('Éxito', 'Categoría actualizada correctamente.');
        } catch (error) {
          console.error("Error saving category edit:", error);
          openCustomModal('Error', 'No se pudo actualizar la categoría: ' + error.message);
        }
      };
  
      const cancelEditCategory = () => {
        editCategoryId.value = null;
        editCategory.value = { name: '', code: '' };
      };
  
      const showConfirmDeleteCategory = async (id, name) => {
        const result = await openCustomModal(
          'Confirmar Eliminación',
          `Para eliminar la categoría "${name}", escribe la palabra "Eliminar" en el campo de abajo:`,
          'confirm-text',
          'Eliminar'
        );
        if (result) {
          deleteCategory(id);
        }
      };
  
      const deleteCategory = async (id) => {
        try {
          await deleteDoc(doc(db, 'businesses', businessId, 'loanCategories', id));
          openCustomModal('Éxito', 'Categoría eliminada correctamente.');
        } catch (error) {
          console.error("Error deleting category:", error);
          openCustomModal('Error', 'No se pudo eliminar la categoría: ' + error.message);
        }
      };
  
      // Filtered and sorted categories
      const filteredCategories = computed(() => {
        if (!categorySearchQuery.value) return categories.value;
        const query = categorySearchQuery.value.toLowerCase();
        return categories.value.filter(cat =>
          cat.name.toLowerCase().includes(query) ||
          cat.code.toLowerCase().includes(query)
        );
      });
  
      const sortedFilteredCategories = computed(() => {
        const list = [...filteredCategories.value]; // Create a copy to sort
        if (!categorySortBy.value) return list;
  
        return list.sort((a, b) => {
          const aValue = a[categorySortBy.value] || '';
          const bValue = b[categorySortBy.value] || '';
  
          if (aValue < bValue) return categorySortDirection.value === 'asc' ? -1 : 1;
          if (aValue > bValue) return categorySortDirection.value === 'asc' ? 1 : -1;
          return 0;
        });
      });
  
      const sortCategories = (key) => {
        if (categorySortBy.value === key) {
          categorySortDirection.value = categorySortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
          categorySortBy.value = key;
          categorySortDirection.value = 'asc';
        }
      };
  
      // --- Ubicaciones Logic ---
      const ubicaciones = ref([]);
      const newUbicacion = ref({ name: '', code: '' });
      const editUbicacionId = ref(null);
      const editUbicacion = ref({ name: '', code: '' });
      const ubicacionSearchQuery = ref('');
      const ubicacionSortBy = ref('code'); // Default sort
      const ubicacionSortDirection = ref('asc'); // Default direction
  
      const ubicacionesCol = collection(db, 'businesses', businessId, 'ubicaciones');
  
      // Real-time listener for ubicaciones
      onMounted(() => {
        onSnapshot(ubicacionesCol, (snapshot) => {
          ubicaciones.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }, (error) => {
          console.error("Error fetching ubicaciones:", error);
          openCustomModal('Error', 'No se pudieron cargar las ubicaciones: ' + error.message);
        });
      });
  
      const addUbicacion = async () => {
        if (!newUbicacion.value.name || !newUbicacion.value.code) {
          openCustomModal('Advertencia', 'Por favor, complete todos los campos para la ubicación.');
          return;
        }
        try {
          await addDoc(ubicacionesCol, {
            name: newUbicacion.value.name,
            code: newUbicacion.value.code,
            createdAt: new Date(),
          });
          newUbicacion.value = { name: '', code: '' };
          openCustomModal('Éxito', 'Ubicación agregada correctamente.');
        } catch (error) {
          console.error("Error adding ubicacion:", error);
          openCustomModal('Error', 'No se pudo agregar la ubicación: ' + error.message);
        }
      };
  
      const startEditUbicacion = (ubi) => {
        editUbicacionId.value = ubi.id;
        editUbicacion.value = { name: ubi.name, code: ubi.code };
      };
  
      const saveEditUbicacion = async (id) => {
        if (!editUbicacion.value.name || !editUbicacion.value.code) {
          openCustomModal('Advertencia', 'Por favor, complete todos los campos para editar la ubicación.');
          return;
        }
        try {
          const docRef = doc(db, 'businesses', businessId, 'ubicaciones', id);
          await updateDoc(docRef, {
            name: editUbicacion.value.name,
            code: editUbicacion.value.code,
            updatedAt: new Date(),
          });
          cancelEditUbicacion();
          openCustomModal('Éxito', 'Ubicación actualizada correctamente.');
        } catch (error) {
          console.error("Error saving ubicacion edit:", error);
          openCustomModal('Error', 'No se pudo actualizar la ubicación: ' + error.message);
        }
      };
  
      const cancelEditUbicacion = () => {
        editUbicacionId.value = null;
        editUbicacion.value = { name: '', code: '' };
      };
  
      const showConfirmDeleteUbicacion = async (id, name) => {
        const result = await openCustomModal(
          'Confirmar Eliminación',
          `Para eliminar la ubicación "${name}", escribe la palabra "Eliminar" en el campo de abajo:`,
          'confirm-text',
          'Eliminar'
        );
        if (result) {
          deleteUbicacion(id);
        }
      };
  
      const deleteUbicacion = async (id) => {
        try {
          await deleteDoc(doc(db, 'businesses', businessId, 'ubicaciones', id));
          openCustomModal('Éxito', 'Ubicación eliminada correctamente.');
        } catch (error) {
          console.error("Error deleting ubicacion:", error);
          openCustomModal('Error', 'No se pudo eliminar la ubicación: ' + error.message);
        }
      };
  
      // Filtered and sorted ubicaciones
      const filteredUbicaciones = computed(() => {
        if (!ubicacionSearchQuery.value) return ubicaciones.value;
        const query = ubicacionSearchQuery.value.toLowerCase();
        return ubicaciones.value.filter(ubi =>
          ubi.name.toLowerCase().includes(query) ||
          ubi.code.toLowerCase().includes(query)
        );
      });
  
      const sortedFilteredUbicaciones = computed(() => {
        const list = [...filteredUbicaciones.value]; // Create a copy to sort
        if (!ubicacionSortBy.value) return list;
  
        return list.sort((a, b) => {
          const aValue = a[ubicacionSortBy.value] || '';
          const bValue = b[ubicacionSortBy.value] || '';
  
          if (aValue < bValue) return ubicacionSortDirection.value === 'asc' ? -1 : 1;
          if (aValue > bValue) return ubicacionSortDirection.value === 'asc' ? 1 : -1;
          return 0;
        });
      });
  
      const sortUbicaciones = (key) => {
        if (ubicacionSortBy.value === key) {
          ubicacionSortDirection.value = ubicacionSortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
          ubicacionSortBy.value = key;
          ubicacionSortDirection.value = 'asc';
        }
      };
  
      return {
        activeTab,
        // Categories
        categories,
        newCategory,
        editCategoryId,
        editCategory,
        categorySearchQuery,
        sortedFilteredCategories,
        addCategory,
        startEditCategory,
        saveEditCategory,
        cancelEditCategory,
        showConfirmDeleteCategory,
        sortCategories,
        categorySortBy,
        categorySortDirection,
        // Ubicaciones
        ubicaciones,
        newUbicacion,
        editUbicacionId,
        editUbicacion,
        ubicacionSearchQuery,
        sortedFilteredUbicaciones,
        addUbicacion,
        startEditUbicacion,
        saveEditUbicacion,
        cancelEditUbicacion,
        showConfirmDeleteUbicacion,
        sortUbicaciones,
        ubicacionSortBy,
        ubicacionSortDirection,
        // Custom Modal
        showCustomModal,
        customModalTitle,
        customModalMessage,
        customModalType,
        customModalConfirmText,
        confirmTextInput,
        closeCustomModal,
        handleConfirmText,
      };
    },
  };
  </script>
  
  <style scoped>
  .table {
    font-size: 0.9rem;
  }
  .modal {
    background: rgba(0, 0, 0, 0.5);
  }
  .modal-dialog {
    margin-top: 5%;
  }
  .py-4 {
    padding-top: 1.5rem !important;
    padding-bottom: 1.5rem !important;
  }
  .sortable {
    cursor: pointer;
    user-select: none; /* Prevent text selection on click */
  }
  .sortable:hover {
    background-color: #f8f9fa; /* Light hover effect */
  }
  .bi {
    margin-left: 5px;
  }
  </style>