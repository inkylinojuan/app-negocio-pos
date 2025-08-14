<template>
  <MenuInventario />

  <div class="container py-4">
    <!-- Barra de búsqueda y botón -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <input
        v-model="search"
        type="text"
        class="form-control w-50"
        placeholder="Buscar activo por nombre o serial..."
      />
      <button class="btn btn-primary" @click="openModal()">
        Crear Activo
      </button>
    </div>

    <!-- Tabla de activos -->
    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th>Nombre Activo</th>
          <th>Serial</th>
          <th>Bodega</th>
          <th>Persona a cargo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in filteredAssets" :key="asset.id">
          <td>{{ asset.name }}</td>
          <td>{{ asset.serial }}</td>
          <td>{{ getLocationName(asset.locationId) }}</td>
          <td>{{ asset.responsible }}</td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="openModal(asset)">Editar</button>
            <button class="btn btn-danger btn-sm" @click="deleteAsset(asset.id)">Eliminar</button>
          </td>
        </tr>
        <tr v-if="filteredAssets.length === 0">
          <td colspan="5" class="text-center">No se encontraron activos</td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Crear/Editar -->
    <div class="modal fade" id="assetModal" tabindex="-1" aria-hidden="true" ref="modalElement">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form @submit.prevent="saveAsset">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar Activo' : 'Crear Activo' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body row g-3">
              <div class="col-md-6">
                <label class="form-label">Nombre</label>
                <input v-model="assetForm.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Descripción</label>
                <input v-model="assetForm.description" type="text" class="form-control" />
              </div>

              <!-- Campo Serial con bloqueo -->
              <div class="col-md-4">
                <label class="form-label">Serial RFID</label>
                <input
                  v-model="assetForm.serial"
                  type="text"
                  class="form-control"
                  :readonly="isSerialLocked"
                  @input="lockSerialIfFilled"
                  @keydown.enter.prevent
                  maxlength="24"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label">Bodega</label>
                <select v-model="assetForm.locationId" class="form-select">
                  <option value="">-- Seleccionar bodega --</option>
                  <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Responsable</label>
                <input v-model="assetForm.responsible" type="text" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Descripción Activo</label>
                <textarea v-model="assetForm.metadataJson" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-success">{{ isEditing ? 'Guardar Cambios' : 'Crear' }}</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import MenuInventario from '../../components/MenuInventario.vue';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default {
  name: 'Activos',
  components: { MenuInventario },
  setup() {
    const search = ref('');
    const assets = ref([]);
    const locations = ref([]);
    const isEditing = ref(false);
    const currentId = ref(null);
    const modalElement = ref(null);

    // Control del bloqueo de serial
    const isSerialLocked = ref(false);

    const assetForm = ref({
      name: '',
      description: '',
      serial: '',
      type: 'fijo',
      locationId: '',
      responsible: '',
      tagId: null,
      status: 'disponible',
      metadataJson: ''
    });

    const resetForm = () => {
      assetForm.value = {
        name: '',
        description: '',
        serial: '',
        type: 'fijo',
        locationId: '',
        responsible: '',
        tagId: null,
        status: 'disponible',
        metadataJson: ''
      };
      isSerialLocked.value = false;
    };

    // Bloqueo del serial cuando se detecten los 24 caracteres
    let serialTimeout = null;
    const lockSerialIfFilled = () => {
      clearTimeout(serialTimeout);
      serialTimeout = setTimeout(() => {
        if (assetForm.value.serial.trim().length >= 24) {
          isSerialLocked.value = true;
        }
      }, 200); // espera 200ms después de la última tecla
    };

    // Cargar activos
    const fetchAssets = async () => {
      const snapshot = await getDocs(collection(db, 'assets'));
      assets.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    // Cargar bodegas
    const fetchLocations = async () => {
      const snapshot = await getDocs(collection(db, 'locations'));
      locations.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const getLocationName = (id) => {
      const loc = locations.value.find(l => l.id === id);
      return loc ? loc.name : 'Sin asignar';
    };

    const filteredAssets = computed(() => {
      if (!search.value) return assets.value;
      return assets.value.filter(a =>
        a.name.toLowerCase().includes(search.value.toLowerCase()) ||
        a.serial.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const openModal = (asset = null) => {
      if (asset) {
        isEditing.value = true;
        currentId.value = asset.id;
        assetForm.value = { ...asset, metadataJson: asset.metadata || '' };
        isSerialLocked.value = true; // bloquear en edición
      } else {
        isEditing.value = false;
        currentId.value = null;
        resetForm(); // desbloquear en creación
      }
      const modal = new bootstrap.Modal(modalElement.value);
      modal.show();
    };

    const saveAsset = async () => {
      try {
        const data = {
          ...assetForm.value,
          metadata: assetForm.value.metadataJson,
          updatedAt: serverTimestamp()
        };
        if (isEditing.value) {
          await updateDoc(doc(db, 'assets', currentId.value), data);
          alert('Activo actualizado correctamente');
        } else {
          data.createdAt = serverTimestamp();
          await addDoc(collection(db, 'assets'), data);
          alert('Activo creado correctamente');
        }
        await fetchAssets();
        bootstrap.Modal.getInstance(modalElement.value).hide();
      } catch (error) {
        console.error(error);
        alert('Error al guardar activo');
      }
    };

    const deleteAsset = async (id) => {
      if (confirm('¿Estás seguro de eliminar este activo?')) {
        await deleteDoc(doc(db, 'assets', id));
        await fetchAssets();
      }
    };

    onMounted(() => {
      fetchAssets();
      fetchLocations();
    });

    return {
      search,
      assets,
      locations,
      filteredAssets,
      assetForm,
      isEditing,
      modalElement,
      getLocationName,
      openModal,
      saveAsset,
      deleteAsset,
      isSerialLocked,
      lockSerialIfFilled
    };
  }
};
</script>

