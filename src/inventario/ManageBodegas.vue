<template>
  <MenuInventario/>
    <div class="container mt-5">
      <h2 class="mb-4">Gestión de Bodegas</h2>
      
      <!-- Botón para crear nueva bodega -->
      <div class="mb-3">
        <button class="btn btn-primary" @click="openCreateModal">
          Crear Nueva Bodega
        </button>
      </div>
      
      <!-- Tabla de bodegas -->
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <!--<th>Área (m²)</th>
            <th>Responsable</th>
            <th>Tipo de Activos</th>
            <th>Cantidad de Activos</th>
            <th>Observaciones</th>-->
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bodega in bodegas" :key="bodega.id">
            <td>{{ bodega.nombre }}</td>
            <td>{{ bodega.tipo }}</td>
            <!--<td>{{ bodega.area }}</td>
            <td>{{ bodega.responsable }}</td>
            <td>{{ bodega.tipoActivos }}</td>
            <td>{{ bodega.cantidadActivos }}</td>
            <td>{{ bodega.observaciones }}</td>-->
            <td>
              <button class="btn btn-sm btn-warning me-1" @click="openEditModal(bodega)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="deleteBodega(bodega)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Modal para crear/editar bodega -->
      <div v-if="showModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="handleSubmit">
              <div class="modal-header">
                <h5 class="modal-title">{{ isEditMode ? 'Editar Bodega' : 'Crear Nueva Bodega' }}</h5>
                <button type="button" class="btn-close" @click="closeModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre</label>
                  <input v-model="currentBodega.nombre" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Área (m²)</label>
                  <input v-model.number="currentBodega.area" type="number" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Tipo</label>
                  <input v-model="currentBodega.tipo" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Responsable</label>
                  <input v-model="currentBodega.responsable" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Tipo de Activos</label>
                  <input v-model="currentBodega.tipoActivos" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Cantidad de Activos</label>
                  <input v-model.number="currentBodega.cantidadActivos" type="number" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Observaciones</label>
                  <textarea v-model="currentBodega.observaciones" class="form-control"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">{{ isEditMode ? 'Actualizar' : 'Crear' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Mensaje de estado -->
      <div v-if="message" class="alert alert-info mt-3">
        {{ message }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
  import { db } from '../firebase'
  import MenuInventario from '../components/MenuInventario.vue'
  
  export default {
    name: 'ManageBodegas',
    components: { MenuInventario },
    setup() {
      // Se obtiene el businessId desde localStorage
      const businessId = localStorage.getItem('businessId') || ''
      // Define la referencia a la colección "bodegas" en el negocio
      const bodegasCol = collection(db, 'businesses', businessId, "bodegas")
      
      const bodegas = ref([])
      const message = ref('')
      const showModal = ref(false)
      const isEditMode = ref(false)
      
      // Objeto para la bodega actual (para crear o editar)
      const currentBodega = ref({
        nombre: '',
        area: 0,
        tipo: '',
        responsable: '',
        tipoActivos: '',
        cantidadActivos: 0,
        observaciones: ''
      })
      
      // Función para cargar las bodegas
      const fetchBodegas = async () => {
        try {
          const snap = await getDocs(bodegasCol)
          bodegas.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        } catch (error) {
          message.value = `Error al cargar bodegas: ${error.message}`
        }
      }
      
      // Abrir modal para crear
      const openCreateModal = () => {
        // Reinicia currentBodega a valores por defecto
        currentBodega.value = {
          nombre: '',
          area: 0,
          tipo: '',
          responsable: '',
          tipoActivos: '',
          cantidadActivos: 0,
          observaciones: ''
        }
        isEditMode.value = false
        showModal.value = true
      }
      
      // Abrir modal para editar
      const openEditModal = (bodega) => {
        // Copia la bodega a editar
        currentBodega.value = { ...bodega }
        isEditMode.value = true
        showModal.value = true
      }
      
      // Cerrar modal
      const closeModal = () => {
        showModal.value = false
      }
      
      // Guardar (crear o actualizar) la bodega
      const handleSubmit = async () => {
        try {
          if (isEditMode.value) {
            // Actualizar
            const bodegaDoc = doc(db, 'businesses', businessId, "bodegas", currentBodega.value.id)
            await updateDoc(bodegaDoc, { ...currentBodega.value })
            message.value = 'Bodega actualizada correctamente.'
          } else {
            // Crear nueva
            await addDoc(bodegasCol, { ...currentBodega.value })
            message.value = 'Bodega creada correctamente.'
          }
          await fetchBodegas()
          closeModal()
        } catch (error) {
          message.value = `Error: ${error.message}`
        }
      }
      
      // Eliminar bodega
      const deleteBodega = async (bodega) => {
        if (confirm(`¿Está seguro de eliminar la bodega ${bodega.nombre}?`)) {
          try {
            const bodegaDoc = doc(db, 'businesses', businessId, "bodegas", bodega.id)
            await deleteDoc(bodegaDoc)
            message.value = 'Bodega eliminada correctamente.'
            await fetchBodegas()
          } catch (error) {
            message.value = `Error al eliminar: ${error.message}`
          }
        }
      }
      
      onMounted(() => {
        fetchBodegas()
      })
      
      return {
        bodegas,
        message,
        showModal,
        currentBodega,
        isEditMode,
        openCreateModal,
        openEditModal,
        closeModal,
        handleSubmit,
        deleteBodega
      }
    }
  }
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
  .mt-5 {
    margin-top: 1rem !important;
  }
  </style>
  