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
      <button class="btn btn-primary" @click="openModal()">Crear Activo</button>
    </div>

    <!-- Tabla de activos -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nombre Activo</th>
          <th>Serial</th>
          <th>Persona a Cargo</th>
          <th>Bodega</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in filteredAssets" :key="asset.id">
          <td>{{ asset.name }}</td>
          <td>{{ asset.serial }}</td>
          <td>{{ asset.responsible || 'Sin asignar' }}</td>
          <td>{{ asset.locationName || 'Sin asignar' }}</td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="openModal(asset)">Editar</button>
            <button class="btn btn-danger btn-sm" @click="deleteAsset(asset.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal -->
  <div v-if="showModal" class="modal-backdrop">
    <div class="modal-content p-4">
      <h4>{{ editMode ? 'Editar Activo' : 'Crear Activo' }}</h4>
      <form @submit.prevent="saveAsset">
        <div class="mb-3">
          <label class="form-label">tipo Activo</label>
          <input v-model="asset.name" type="text" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <input v-model="asset.description" type="text" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Serial</label>
          <input v-model="asset.serial" type="text" class="form-control" requiredgit status />
        </div>
        <div class="mb-3">
          <label class="form-label">Bodega</label>
          <select v-model="asset.locationId" class="form-select">
            <option value="">Bodega Envigado</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Responsable</label>
          <input v-model="asset.responsible" type="text" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Descripción Activo</label>
          <textarea v-model="asset.metadataJson" class="form-control" rows="2"></textarea>
        </div>

        <div class="text-end">
          <button type="button" class="btn btn-secondary me-2" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn btn-success">{{ editMode ? 'Actualizar' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import MenuInventario from "../../components/MenuInventario.vue";

export default {
  name: "Activos",
  components: { MenuInventario },
  setup() {
    const search = ref("");
    const showModal = ref(false);
    const editMode = ref(false);
    const asset = ref({});
    const assets = ref([]);
    const locations = ref([]);

    const fetchLocations = async () => {
      const snapshot = await getDocs(collection(db, "locations"));
      locations.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchAssets = async () => {
      const snapshot = await getDocs(collection(db, "assets"));
      assets.value = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          locationName: locations.value.find(loc => loc.id === data.locationId)?.name || ""
        };
      });
    };

    const openModal = (item = null) => {
      if (item) {
        asset.value = { ...item, metadataJson: item.metadata || "" };
        editMode.value = true;
      } else {
        asset.value = { name: "", description: "", serial: "", locationId: "", responsible: "", metadataJson: "" };
        editMode.value = false;
      }
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const saveAsset = async () => {
      try {
        if (editMode.value) {
          await updateDoc(doc(db, "assets", asset.value.id), {
            ...asset.value,
            metadata: asset.value.metadataJson,
            updatedAt: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, "assets"), {
            ...asset.value,
            type: "fijo",
            status: "disponible",
            metadata: asset.value.metadataJson,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        await fetchAssets();
        closeModal();
      } catch (err) {
        console.error("Error guardando activo:", err);
      }
    };

    const deleteAsset = async (id) => {
      if (confirm("¿Seguro que quieres eliminar este activo?")) {
        await deleteDoc(doc(db, "assets", id));
        await fetchAssets();
      }
    };

    const filteredAssets = computed(() => {
      return assets.value.filter(a =>
        a.name?.toLowerCase().includes(search.value.toLowerCase()) ||
        a.serial?.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    onMounted(async () => {
      await fetchLocations();
      await fetchAssets();
    });

    return {
      search,
      showModal,
      editMode,
      asset,
      assets,
      locations,
      filteredAssets,
      openModal,
      closeModal,
      saveAsset,
      deleteAsset
    };
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
}
</style>
