<template>
  <MenuInventario/>
  <div>
    <h2>Leer un Tag</h2>
    <button @click="toggleReadSingleRFID">
      {{ readingSingle ? 'Stop' : 'Leer RFID' }}
    </button>
    <div v-if="rfid !== ''">
      <p>RFID: {{ rfid }}</p>
      <input v-model="name" placeholder="Nombre" class="large-input" />
      
      <!-- Dropdown para seleccionar Bodega -->
      <div class="mb-3">
        <label class="form-label">Bodega</label>
        <select v-model="selectedBodegaId" class="form-select">
          <option disabled value="">Seleccione una bodega</option>
          <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
            {{ bodega.nombre }}
          </option>
        </select>
      </div>
      
      <button @click="saveSingleTag">Guardar datos</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../firebase'
import { doc, collection, getDocs, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import MenuInventario from '../components/MenuInventario.vue'

export default {
  name: 'SingleRFID',
  components: { MenuInventario },
  setup() {
    const rfid = ref("")
    const name = ref("")
    const readingSingle = ref(false)
    const businessId = localStorage.getItem('businessId') || ''
    
    // Variables para las bodegas
    const bodegas = ref([])
    const selectedBodegaId = ref("")
    
    // Cargar bodegas disponibles desde Firestore
    const fetchBodegas = async () => {
      try {
        const bodegasCol = collection(db, 'businesses', businessId, "bodegas")
        const snap = await getDocs(bodegasCol)
        bodegas.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error("Error al cargar bodegas:", error)
      }
    }
    
    // Cargamos bodegas al montar el componente
    onMounted(() => {
      fetchBodegas()
      // Asigna los callbacks para recibir el RFID real desde Android
      window.displayRFID = handleDisplayRFID
      window.readingStopped = handleReadingStopped
      window.appendTag = handleAppendTag
      console.log("SingleRFID: Callbacks registrados para RFID")
    })
  
    onUnmounted(() => {
      window.displayRFID = null
      window.readingStopped = null
      window.appendTag = null
      console.log("SingleRFID: Callbacks removidos")
    })
    
    function toggleReadSingleRFID() {
      if (!readingSingle.value) {
        if (window.AndroidInterface && window.AndroidInterface.readRFID) {
          console.log("Iniciando lectura real de RFID")
          window.AndroidInterface.readRFID() // Se espera que este método invoque displayRFID con el valor real
          readingSingle.value = true
          rfid.value = ""
        } else {
          console.error("AndroidInterface.readRFID no está disponible")
          readingSingle.value = false
        }
      } else {
        if (window.AndroidInterface && window.AndroidInterface.stopRFID) {
          console.log("Deteniendo lectura real de RFID")
          window.AndroidInterface.stopRFID()
          readingSingle.value = false
        } else {
          console.error("AndroidInterface.stopRFID no está disponible")
          readingSingle.value = false
        }
      }
    }
  
    async function saveSingleTag() {
      if (!rfid.value) {
        alert("No se ha leído ningún RFID");
        return;
      }
      
      // Buscamos la bodega seleccionada en el arreglo de bodegas
      const selectedBodega = bodegas.value.find(b => b.id === selectedBodegaId.value)
      if (!selectedBodega) {
        alert("Por favor, seleccione una bodega.")
        return;
      }
      
      // Creamos la referencia al documento en "tags" usando el RFID como ID
      const tagDocRef = doc(db, 'businesses', businessId, "tags", rfid.value)
      
      // Verificamos si ya existe un documento con ese RFID
      const docSnap = await getDoc(tagDocRef)
      if (docSnap.exists()) {
        alert("Este tag ya se ha utilizado para otro registro.");
        return;
      }
      
      try {
        await setDoc(tagDocRef, {
          tag: rfid.value,
          name: name.value,
          bodega: selectedBodega, // Se guarda la bodega completa
          timestamp: serverTimestamp()
        })
        alert("Datos guardados correctamente en Firebase")
        // Reiniciamos campos
        rfid.value = ""
        name.value = ""
        selectedBodegaId.value = ""
        readingSingle.value = false
      } catch (error) {
        console.error("Error al guardar datos:", error)
        alert("Error al guardar datos: " + error.message)
      }
    }
  
    // Función que será llamada por Android con el valor real del RFID
    function handleDisplayRFID(value) {
      console.log("RFID recibido:", value)
      if (readingSingle.value) {
        rfid.value = value
        console.log("rfid actualizado a:", rfid.value)
      }
    }
  
    function handleReadingStopped() {
      console.log("Lectura detenida desde Android")
      readingSingle.value = false
    }
  
    function handleAppendTag(tagData) {
      console.log("Nuevo tag recibido en SingleRFID:", tagData)
      try {
        const tagObj = typeof tagData === "string" ? JSON.parse(tagData) : tagData
        if (tagObj && tagObj.tag) {
          rfid.value = tagObj.tag
          console.log("rfid actualizado a:", rfid.value)
        } else {
          console.error("El objeto recibido no tiene la propiedad 'tag'")
        }
      } catch (error) {
        console.error("Error en appendTag:", error)
      }
    }
  
    watch(rfid, (newVal) => {
      console.log("watch: rfid cambió a", newVal)
    })
  
    return {
      rfid,
      name,
      selectedBodegaId,
      bodegas,
      readingSingle,
      toggleReadSingleRFID,
      saveSingleTag
    }
  }
}
</script>
  
<style>
.large-input {
  font-size: 16px;
  padding: 8px;
  margin: 0.5em 0;
  width: 100%;
  box-sizing: border-box;
}
</style>
