<template>
  <div class="modal-header">
    <h5 class="modal-title">Gestión de Bodegas</h5>
    <button v-if="selectMode" type="button" class="btn-close" @click="emit('close')"></button>
    <button v-else type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  </div>
  <div class="modal-body">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <input v-model="search" type="text" class="form-control w-50" placeholder="Buscar bodega..." />
      <button class="btn btn-primary" @click="openModal()"><i class="bi bi-plus-circle"></i> Crear Bodega</button>
    </div>
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Capacidad</th>
            <th>Estado</th>
            <th>Activos</th>
            <th v-if="!selectMode">Acciones</th>
            <th v-else>Seleccionar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredUbicaciones.length === 0">
            <td :colspan="selectMode ? 5 : 6" class="text-center">No se encontraron ubicaciones</td>
          </tr>
          <tr v-for="ubicacion in filteredUbicaciones" :key="ubicacion.id">
            <td>{{ ubicacion.name }}</td>
            <td>{{ ubicacion.capacity }}</td>
            <td>{{ ubicacion.status }}</td>
            <td>
              <span class="badge bg-primary rounded-pill">
                {{ getAssetCount(ubicacion.id) }}
              </span>
            </td>
            <td v-if="!selectMode">
              <button class="btn btn-sm btn-info me-2" @click="openDetailsModal(ubicacion)">
                <i class="bi bi-journal-text"></i> Detalles
              </button>
              <button class="btn btn-sm btn-warning me-2" @click="openModal(ubicacion)">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteUbicacion(ubicacion.id)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
            <td v-else>
              <button class="btn btn-sm btn-info" @click="emit('ubicacion-seleccionada', ubicacion)">
                Seleccionar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="modal fade" id="ubicacionModal" tabindex="-1" aria-hidden="true" ref="modalElement">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="saveUbicacion">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar Bodega' : 'Crear Bodega' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="ubicacion-name" class="form-label">Nombre de la Bodega</label>
                <input v-model="ubicacionForm.name" type="text" class="form-control" id="ubicacion-name" required />
              </div>
              <div class="mb-3">
                <label for="ubicacion-capacity" class="form-label">Capacidad (número de activos)</label>
                <input v-model.number="ubicacionForm.capacity" type="number" class="form-control" id="ubicacion-capacity" required />
              </div>
              <div class="mb-3">
                <label for="ubicacion-status" class="form-label">Estado</label>
                <select v-model="ubicacionForm.status" class="form-select" id="ubicacion-status" required>
                  <option value="Activa">Activa</option>
                  <option value="En Mantenimiento">En Mantenimiento</option>
                  <option value="Inactiva">Inactiva</option>
                  <option value="Inactiva">En inventario</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary">{{ isEditing ? 'Guardar Cambios' : 'Crear' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="modal fade" id="detailsModal" tabindex="-1" aria-hidden="true" ref="detailsModalElement">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles y Movimientos de Bodega: {{ selectedUbicacion?.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedUbicacion">
            <h6>**Activos en esta Bodega ({{ getAssetsInLocation(selectedUbicacion.id).length }})**</h6>
            <div class="table-responsive mb-4">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Serial</th>
                    <th>Responsable</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="asset in getAssetsInLocation(selectedUbicacion.id)" :key="asset.id">
                    <td>{{ asset.name }}</td>
                    <td>{{ asset.serial }}</td>
                    <td>{{ asset.responsible }}</td>
                    <td>
                      <button class="btn btn-sm btn-secondary" @click="openMoveModal(asset)">Mover</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h6>**Historial de Movimientos de la Bodega**</h6>
            <div class="table-responsive">
              <table class="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Activo</th>
                    <th>Serial</th>
                    <th>Ubicación Anterior</th>
                    <th>Ubicación Nueva</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(movement, index) in getMovementHistory(selectedUbicacion.id)" :key="index">
                    <td>{{ movement.timestamp ? new Date(movement.timestamp.seconds * 1000).toLocaleString('es-CO') : 'N/A' }}</td>
                    <td>{{ movement.assetName }}</td>
                    <td>{{ movement.assetSerial }}</td>
                    <td>{{ movement.oldLocationName }}</td>
                    <td>{{ movement.newLocationName }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal fade" id="moveModal" tabindex="-1" aria-hidden="true" ref="moveModalElement">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Mover Activo: {{ assetToMove?.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Mover a bodega:</label>
              <select v-model="newLocationId" class="form-select">
                <option v-for="loc in locationsWithoutCurrent" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="moveAsset">Mover</button>
          </div>
        </div>
      </div>
    </div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true" ref="toastElement">
        <div class="toast-header">
          <strong class="me-auto">Notificación</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import eventBus from '../../utils/eventBus';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default {
  name: 'FijosUbicacionesView',
  props: {
    selectMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const ubicaciones = ref([]);
    const assets = ref([]);
    const ubicacionForm = ref({
      name: '',
      capacity: 0,
      status: 'Activa',
    });
    const isEditing = ref(false);
    const currentId = ref(null);
    const modalElement = ref(null);
    const search = ref('');
    const toastElement = ref(null);
    const toastMessage = ref('');
    const showToast = (message) => {
      toastMessage.value = message;
      const toast = new bootstrap.Toast(toastElement.value);
      toast.show();
    };
    const detailsModalElement = ref(null);
    const moveModalElement = ref(null);
    const selectedUbicacion = ref(null);
    const assetToMove = ref(null);
    const newLocationId = ref(null);
    const fetchUbicaciones = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'locations'));
        ubicaciones.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching ubicaciones:", error);
        showToast('❌ Error al cargar bodegas.');
      }
    };
    const fetchAssets = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'assets'));
        assets.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching assets:", error);
        showToast('❌ Error al cargar activos.');
      }
    };
    const getAssetCount = (locationId) => {
      return assets.value.filter((asset) => asset.locationId === locationId).length;
    };
    const filteredUbicaciones = computed(() => {
      return ubicaciones.value.filter(
        (ubicacion) => ubicacion.name.toLowerCase().includes(search.value.toLowerCase()) || ubicacion.status.toLowerCase().includes(search.value.toLowerCase())
      );
    });
    const resetForm = () => {
      ubicacionForm.value = {
        name: '',
        capacity: 0,
        status: 'Activa',
      };
      isEditing.value = false;
      currentId.value = null;
    };
    const openModal = (ubicacion = null) => {
      if (ubicacion) {
        isEditing.value = true;
        currentId.value = ubicacion.id;
        ubicacionForm.value = { ...ubicacion };
      } else {
        resetForm();
      }
      const modal = new bootstrap.Modal(modalElement.value);
      modal.show();
    };
    const saveUbicacion = async () => {
      try {
        if (isEditing.value) {
          await updateDoc(doc(db, 'locations', currentId.value), ubicacionForm.value);
          showToast('✅ Bodega actualizada correctamente');
        } else {
          await addDoc(collection(db, 'locations'), ubicacionForm.value);
          showToast('✅ Bodega creada correctamente');
        }
        await fetchUbicaciones();
        bootstrap.Modal.getInstance(modalElement.value).hide();
      } catch (error) {
        console.error(error);
        showToast('❌ Error al guardar bodega');
      }
    };
    const deleteUbicacion = async (id) => {
      const assetCount = getAssetCount(id);
      if (assetCount > 0) {
        alert(`No se puede eliminar esta bodega porque tiene ${assetCount} activos asignados.`);
        return;
      }
      if (confirm('¿Estás seguro de eliminar esta bodega?')) {
        try {
          await deleteDoc(doc(db, 'locations', id));
          await fetchUbicaciones();
          showToast('✅ Bodega eliminada correctamente');
        } catch (error) {
          console.error(error);
          showToast('❌ Error al eliminar bodega');
        }
      }
    };
    const getAssetsInLocation = (locationId) => {
      return assets.value.filter(asset => asset.locationId === locationId);
    };
    const getMovementHistory = (locationId) => {
      const history = [];
      assets.value.forEach(asset => {
        if (asset.history && Array.isArray(asset.history)) {
          asset.history.forEach(movement => {
            if (movement.oldLocationId === locationId || movement.newLocationId === locationId) {
              history.push({
                ...movement,
                assetName: asset.name,
                assetSerial: asset.serial,
                oldLocationName: ubicaciones.value.find(loc => loc.id === movement.oldLocationId)?.name || 'N/A',
                newLocationName: ubicaciones.value.find(loc => loc.id === movement.newLocationId)?.name || 'N/A',
              });
            }
          });
        }
      });
      return history.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
    };
    const openDetailsModal = (ubicacion) => {
      selectedUbicacion.value = ubicacion;
      const modal = new bootstrap.Modal(detailsModalElement.value);
      modal.show();
    };
    const handleEdit = () => {
      const detailsModal = bootstrap.Modal.getInstance(detailsModalElement.value);
      if (detailsModal) {
        detailsModal.hide();
      }
      openModal(selectedUbicacion.value);
    };
    const openMoveModal = (asset) => {
      assetToMove.value = asset;
      newLocationId.value = null;
      const detailsModal = bootstrap.Modal.getInstance(detailsModalElement.value);
      if (detailsModal) {
        detailsModal.hide();
      }
      const moveModal = new bootstrap.Modal(moveModalElement.value);
      moveModal.show();
    };
    const locationsWithoutCurrent = computed(() => {
      if (!assetToMove.value) return [];
      return ubicaciones.value.filter(loc => loc.id !== assetToMove.value.locationId);
    });
    const moveAsset = async () => {
      if (!newLocationId.value) {
        showToast('❌ Por favor, selecciona una nueva bodega.');
        return;
      }
      if (!assetToMove.value) {
        showToast('❌ No se ha seleccionado ningún activo.');
        return;
      }
      try {
        const assetRef = doc(db, 'assets', assetToMove.value.id);
        const oldAsset = (await getDoc(assetRef)).data();
        
        // 🟢 Corrección: Aseguramos que oldAsset.history sea un array antes de usarlo.
        const newHistory = (oldAsset.history && Array.isArray(oldAsset.history)) ? [...oldAsset.history] : [];
        
        const newMovement = {
          oldLocationId: oldAsset.locationId,
          newLocationId: newLocationId.value,
          responsible: oldAsset.responsible,
          timestamp: serverTimestamp()
        };
        newHistory.push(newMovement);
        await updateDoc(assetRef, {
          locationId: newLocationId.value,
          history: newHistory
        });
        const moveModal = bootstrap.Modal.getInstance(moveModalElement.value);
        if (moveModal) moveModal.hide();
        showToast('✅ Activo movido correctamente');
        await fetchAssets();
        eventBus.emit('activosActualizados');
      } catch (error) {
        console.error('Error al mover activo:', error);
        showToast('❌ Error al mover activo: ' + error.message);
      }
    };
    onMounted(() => {
      fetchUbicaciones();
      fetchAssets();
      eventBus.on('activosActualizados', () => {
        fetchUbicaciones();
        fetchAssets();
      });
    });
    return {
      ubicaciones,
      assets,
      ubicacionForm,
      isEditing,
      currentId,
      modalElement,
      search,
      toastElement,
      toastMessage,
      filteredUbicaciones,
      getAssetCount,
      openModal,
      saveUbicacion,
      deleteUbicacion,
      showToast,
      emit,
      detailsModalElement,
      moveModalElement,
      selectedUbicacion,
      assetToMove,
      newLocationId,
      getAssetsInLocation,
      getMovementHistory,
      openDetailsModal,
      openMoveModal,
      locationsWithoutCurrent,
      moveAsset,
      handleEdit,
    };
  },
};
</script>