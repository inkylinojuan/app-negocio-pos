<template>
    <MenuInventario/>
    <div class="container py-4">
      <h2>Crear Activo Fijo</h2>
      <form @submit.prevent="createAsset" class="row g-3">
        <!-- Nombre -->
        <div class="col-md-6">
          <label class="form-label">Nombre</label>
          <input v-model="asset.name" type="text" class="form-control" placeholder="Nombre del activo" required />
        </div>
        <!-- Descripción -->
        <div class="col-md-6">
          <label class="form-label">Descripción</label>
          <input v-model="asset.description" type="text" class="form-control" placeholder="Descripción breve" />
        </div>
        <!-- Número de Serie -->
        <div class="col-md-4">
          <label class="form-label">Número de Serie</label>
          <input v-model="asset.serial" type="text" class="form-control" placeholder="Serial" />
        </div>
        <!-- Ubicación -->
        <div class="col-md-4">
          <label class="form-label">Ubicación</label>
          <select v-model="asset.locationId" class="form-select">
            <option value="">-- Seleccionar bodega --</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <!-- Responsable -->
        <div class="col-md-4">
          <label class="form-label">Responsable</label>
          <input v-model="asset.responsible" type="text" class="form-control" placeholder="Nombre o departamento" />
        </div>
        <!-- Metadatos JSON opcional -->
        <div class="col-12">
          <label class="form-label">Metadatos (JSON)</label>
          <textarea
            v-model="asset.metadataJson"
            class="form-control"
            placeholder='{"marca":"XYZ","modelo":"ABC"}'
            rows="2"
          ></textarea>
        </div>
        <!-- Botón guardar -->
        <div class="col-12 text-end">
          <button type="submit" class="btn btn-success">Crear Activo</button>
        </div>
      </form>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
  import { db } from '../../firebase';
  import MenuInventario from '../../components/MenuInventario.vue'
  
  export default {
    name: 'FijosCrearActivoView',
    components: { MenuInventario },
    setup() {
      // Estado del nuevo activo
      const asset = ref({
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
  
      // Lista de ubicaciones (bodegas)
      const locations = ref([]);
      const fetchLocations = async () => {
        const snapshot = await getDocs(collection(db, 'locations'));
        locations.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      };
  
      onMounted(fetchLocations);
  
      const createAsset = async () => {
        try {
          const data = {
            name: asset.value.name,
            description: asset.value.description,
            serial: asset.value.serial,
            type: asset.value.type,
            locationId: asset.value.locationId || null,
            responsible: asset.value.responsible,
            tagId: null,
            status: 'disponible',
            metadata: asset.value.metadataJson ? JSON.parse(asset.value.metadataJson) : {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'assets'), data);
          // Limpiar formulario
          Object.assign(asset.value, {
            name: '',
            description: '',
            serial: '',
            locationId: '',
            responsible: '',
            metadataJson: ''
          });
          alert('Activo creado correctamente');
        } catch (error) {
          console.error('Error al crear activo:', error);
          alert('Error al crear activo');
        }
      };
  
      return { asset, locations, createAsset };
    }
  };
  </script>
  
  <style scoped>
  /* Ajustes específicos si se requieren */
  </style>
  