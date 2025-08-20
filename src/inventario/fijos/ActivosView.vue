<template>
  <MenuInventario />

  <div v-if="showUbicacionesModal">
    <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <FijosUbicacionesView :selectMode="true" @ubicacion-seleccionada="onUbicacionSeleccionada" />
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showUbicacionesModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container py-4">
    <div class="mb-3 d-flex align-items-end">
      <div class="me-3">
        <label class="form-label">Filtrar por bodega:</label>
        <select v-model="selectedBodega" class="form-select">
          <option value="">-- Todas las bodegas --</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
        </select>
      </div>
      <div>
        <label class="form-label">Filtrar por estado:</label>
        <select v-model="selectedStatus" class="form-select">
          <option value="">-- Todos los estados --</option>
          <option value="disponible">Disponible</option>
          <option value="en_mantenimiento">En Mantenimiento</option>
          <option value="en_reparacion">En Reparación</option>
          <option value="perdido">Perdido</option>
          <option value="fuera_de_servicio">Fuera de Servicio</option>
        </select>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <input v-model="search" type="text" class="form-control w-50" placeholder="Buscar activo por nombre, serial, descripción..." />
      <button class="btn btn-primary" @click="openModal()"><i class="bi bi-plus-circle"></i> Crear Activo</button>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Nombre Activo</th>
            <th>Serial</th>
            <th>Bodega</th>
            <th>Persona a cargo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in paginatedAssets" :key="asset.id">
            <td>{{ asset.name }}</td>
            <td>{{ asset.serial }}</td>
            <td>{{ getLocationName(asset.locationId) }}</td>
            <td>{{ asset.responsible }}</td>
            <td>{{ asset.status }}</td>
            <td>
              <button class="btn btn-info btn-sm me-2" @click="viewAssetDetails(asset)"><i class="bi bi-eye"></i> Detalles</button>
              <button class="btn btn-warning btn-sm me-2" @click="openModal(asset)"><i class="bi bi-pencil"></i> Editar</button>
              <button class="btn btn-danger btn-sm" @click="deleteAsset(asset.id)"><i class="bi bi-trash"></i> Eliminar</button>
            </td>
          </tr>
          <tr v-if="paginatedAssets.length === 0">
            <td colspan="6" class="text-center">No se encontraron activos</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="totalPages > 1">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }"><button class="page-link" @click="currentPage--">Anterior</button></li>
        <li class="page-item" :class="{ active: page === currentPage }" v-for="page in totalPages" :key="page"><button class="page-link" @click="currentPage = page">{{ page }}</button></li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }"><button class="page-link" @click="currentPage++">Siguiente</button></li>
      </ul>
    </nav>

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
                <label class="form-label">Nombre <span class="text-danger">*</span></label>
                <input v-model="assetForm.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Descripción</label>
                <input v-model="assetForm.description" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Serial RFID <span class="text-danger">*</span></label>
                <input v-model="assetForm.serial" type="text" class="form-control" :readonly="isSerialLocked" @input="lockSerialIfFilled" @keydown.enter.prevent maxlength="24" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Bodega <span class="text-danger">*</span></label>
                <div class="input-group">
                  <select v-model="assetForm.locationId" class="form-select" required>
                    <option value="">-- Seleccionar bodega --</option>
                    <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                  </select>
                  <button class="btn btn-outline-secondary" type="button" @click="showUbicacionesModal = true"><i class="bi bi-search"></i></button>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Responsable</label>
                <input v-model="assetForm.responsible" type="text" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Propiedades Adicionales</label>
                <div v-for="(item, index) in assetForm.metadata" :key="index" class="input-group mb-2">
                  <input type="text" v-model="item.key" class="form-control" placeholder="Nombre de la propiedad" />
                  <input type="text" v-model="item.value" class="form-control" placeholder="Valor" />
                  <button type="button" class="btn btn-outline-danger" @click="removeMetadataField(index)"><i class="bi bi-x-circle"></i></button>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="addMetadataField"><i class="bi bi-plus-circle"></i> Agregar Propiedad</button>
              </div>
              <div class="col-md-6">
                <label class="form-label">Estado</label>
                <select v-model="assetForm.status" class="form-select">
                  <option value="disponible">Disponible</option>
                  <option value="en_mantenimiento">En Mantenimiento</option>
                  <option value="en_reparacion">En Reparación</option>
                  <option value="perdido">Perdido</option>
                  <option value="fuera_de_servicio">Fuera de Servicio</option>
                </select>
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

    <div class="modal fade" id="assetDetailsModal" tabindex="-1" aria-hidden="true" ref="detailsModalElement">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles del Activo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body" v-if="selectedAsset">
            <h6>**Información Básica**</h6>
            <p><strong>Nombre:</strong> {{ selectedAsset.name }}</p>
            <p><strong>Serial:</strong> {{ selectedAsset.serial }}</p>
            <p><strong>Bodega:</strong> {{ getLocationName(selectedAsset.locationId) }}</p>
            <p><strong>Responsable:</strong> {{ selectedAsset.responsible }}</p>
            <p><strong>Estado:</strong> {{ selectedAsset.status }}</p>
            <p><strong>Descripción:</strong> {{ selectedAsset.description }}</p>
            <hr />
            <h6>**Propiedades Adicionales**</h6>
            <ul>
              <li v-for="(value, key) in selectedAsset.metadata" :key="key">
                <strong>{{ key }}:</strong> {{ value }}
              </li>
            </ul>
            <hr />
            <h6>**Historial de Movimientos**</h6>
            <div class="table-responsive">
              <table class="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ubicación Anterior</th>
                    <th>Ubicación Nueva</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="movement in selectedAsset.history" :key="movement.timestamp">
                    <td>{{ movement.timestamp ? new Date(movement.timestamp.seconds * 1000).toLocaleString('es-CO') : 'N/A' }}</td>
                    <td>{{ getLocationName(movement.oldLocationId) }}</td>
                    <td>{{ getLocationName(movement.newLocationId) }}</td>
                    <td>{{ movement.responsible }}</td>
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
import FijosUbicacionesView from './FijosUbicacionesView.vue';
import { ref, onMounted, computed } from 'vue';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MenuInventario from '../../components/MenuInventario.vue';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default {
  name: 'Activos',
  components: { MenuInventario, FijosUbicacionesView },
  setup() {
    const showUbicacionesModal = ref(false);
    const selectedBodega = ref('');
    const selectedStatus = ref('');
    const search = ref('');
    const assets = ref([]);
    const locations = ref([]);
    const isEditing = ref(false);
    const currentId = ref(null);
    const modalElement = ref(null);
    const detailsModalElement = ref(null);
    const selectedAsset = ref(null);
    const isSerialLocked = ref(false);

    const currentPage = ref(1);
    const itemsPerPage = 10;
    const totalPages = computed(() => Math.ceil(filteredAssets.value.length / itemsPerPage));
    const paginatedAssets = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredAssets.value.slice(start, end);
    });

    const toastElement = ref(null);
    const toastMessage = ref('');
    const showToast = (message) => {
      toastMessage.value = message;
      const toast = new bootstrap.Toast(toastElement.value);
      toast.show();
    };

    const assetForm = ref({
      name: '',
      description: '',
      serial: '',
      type: 'fijo',
      locationId: '',
      responsible: '',
      tagId: null,
      status: 'disponible',
      metadata: []
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
        metadata: []
      };
      isSerialLocked.value = false;
    };

    const addMetadataField = () => {
      assetForm.value.metadata.push({ key: '', value: '' });
    };

    const removeMetadataField = (index) => {
      assetForm.value.metadata.splice(index, 1);
    };

    let serialTimeout = null;
    const lockSerialIfFilled = () => {
      clearTimeout(serialTimeout);
      serialTimeout = setTimeout(() => {
        if (assetForm.value.serial.trim().length >= 24) {
          isSerialLocked.value = true;
        }
      }, 200);
    };

    const fetchAssets = async () => {
      const snapshot = await getDocs(collection(db, 'assets'));
      assets.value = snapshot.docs.map(doc => {
        const data = doc.data();
        try {
          data.metadata = JSON.parse(data.metadata || '{}');
        } catch (e) {
          data.metadata = {};
        }
        const metadataArray = Object.entries(data.metadata).map(([key, value]) => ({ key, value }));
        return { id: doc.id, ...data, metadataArray };
      });
    };

    const fetchLocations = async () => {
      const snapshot = await getDocs(collection(db, 'locations'));
      locations.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const getLocationName = (id) => {
      const loc = locations.value.find(l => l.id === id);
      return loc ? loc.name : 'Sin asignar';
    };

    const filteredAssets = computed(() => {
      let result = assets.value;
      if (selectedBodega.value) {
        result = result.filter(a => a.locationId === selectedBodega.value);
      }
      if (selectedStatus.value) {
        result = result.filter(a => a.status === selectedStatus.value);
      }
      if (search.value) {
        result = result.filter(a =>
          a.name.toLowerCase().includes(search.value.toLowerCase()) ||
          a.serial.toLowerCase().includes(search.value.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(search.value.toLowerCase())) ||
          (a.metadata && JSON.stringify(a.metadata).toLowerCase().includes(search.value.toLowerCase()))
        );
      }
      return result;
    });

    const openModal = (asset = null) => {
      if (asset) {
        isEditing.value = true;
        currentId.value = asset.id;
        assetForm.value = { ...asset, metadata: asset.metadataArray };
        isSerialLocked.value = true;
      } else {
        isEditing.value = false;
        currentId.value = null;
        resetForm();
      }
      const modal = new bootstrap.Modal(modalElement.value);
      modal.show();
    };

    // 🟢 FUNCIÓN saveAsset CORREGIDA
    const saveAsset = async () => {
      try {
        const metadataObject = {};
        assetForm.value.metadata.forEach(item => {
          if (item.key.trim() !== '') {
            metadataObject[item.key.trim()] = item.value.trim();
          }
        });

        const data = {
          ...assetForm.value,
          metadata: JSON.stringify(metadataObject),
          updatedAt: serverTimestamp()
        };
        delete data.metadataArray;

        if (isEditing.value) {
          const oldAsset = (await getDoc(doc(db, 'assets', currentId.value))).data();
          
          // 🟢 La corrección aquí: crea una copia del historial o un nuevo array vacío
          let newHistory = oldAsset.history && Array.isArray(oldAsset.history) ? [...oldAsset.history] : [];

          if (oldAsset.locationId !== data.locationId || oldAsset.responsible !== data.responsible || oldAsset.status !== data.status) {
            const historyEntry = {
              oldLocationId: oldAsset.locationId,
              newLocationId: data.locationId,
              responsible: data.responsible,
              statusChange: `${oldAsset.status} -> ${data.status}`
            };
            newHistory.push(historyEntry);

            await updateDoc(doc(db, 'assets', currentId.value), {
              ...data,
              history: newHistory
            });

            const lastIndex = newHistory.length - 1;
            const historyUpdate = {};
            historyUpdate[`history.${lastIndex}.timestamp`] = serverTimestamp();
            await updateDoc(doc(db, 'assets', currentId.value), historyUpdate);
          } else {
            await updateDoc(doc(db, 'assets', currentId.value), data);
          }
          showToast('✅ Activo actualizado correctamente');
        } else {
          const initialHistoryEntry = {
            oldLocationId: null,
            newLocationId: data.locationId,
            responsible: data.responsible,
            statusChange: `Creado como ${data.status}`
          };
          data.history = [initialHistoryEntry];
          data.createdAt = serverTimestamp();
          const docRef = await addDoc(collection(db, 'assets'), data);
          const historyUpdate = {};
          historyUpdate[`history.0.timestamp`] = serverTimestamp();
          await updateDoc(doc(db, 'assets', docRef.id), historyUpdate);
          showToast('✅ Activo creado correctamente');
        }
        
        await fetchAssets();
        bootstrap.Modal.getInstance(modalElement.value).hide();
      } catch (error) {
        console.error('Error al guardar activo:', error);
        showToast('❌ Error al guardar activo: ' + error.message);
      }
    };

    const deleteAsset = async (id) => {
      if (confirm('¿Estás seguro de eliminar este activo? Esta acción no se puede revertir.')) {
        try {
          await deleteDoc(doc(db, 'assets', id));
          await fetchAssets();
          showToast('✅ Activo eliminado correctamente');
        } catch (error) {
          console.error(error);
          showToast('❌ Error al eliminar activo');
        }
      }
    };
    
    const onUbicacionSeleccionada = (ubicacion) => {
      assetForm.value.locationId = ubicacion.id;
      showUbicacionesModal.value = false;
    };

    const viewAssetDetails = (asset) => {
      selectedAsset.value = asset;
      const detailsModal = new bootstrap.Modal(detailsModalElement.value);
      detailsModal.show();
    };

    onMounted(() => {
      fetchAssets();
      fetchLocations();
    });

    return {
      showUbicacionesModal,
      onUbicacionSeleccionada,
      selectedBodega,
      selectedStatus,
      search,
      assets,
      locations,
      filteredAssets,
      paginatedAssets,
      currentPage,
      totalPages,
      assetForm,
      isEditing,
      currentId,
      modalElement,
      detailsModalElement,
      selectedAsset,
      toastElement,
      toastMessage,
      getLocationName,
      openModal,
      saveAsset,
      deleteAsset,
      isSerialLocked,
      lockSerialIfFilled,
      viewAssetDetails,
      showToast,
      addMetadataField,
      removeMetadataField
    };
  }
};
</script>