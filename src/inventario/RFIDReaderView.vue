<template>
  <MenuInventario/>
    <div >        
          <div class="mb-3">
            <label class="form-label">RFID leído:</label>
            <input v-model="rfid" type="text" class="form-control" />
          </div>
          <div>
            <p class="mb-0 small"><strong>Estado:</strong> {{ readingStatus }}</p>
          </div>
      
      <!-- Sección de resultados -->
      <div v-if="tagInfo" class="card">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">Información del Tag</h5>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p>Buscando información del tag...</p>
          </div>
          
          <div v-else>
            <h6>Datos del Activo</h6>
            <div class="row mb-3">
              <div class="col-md-6">
                <p><strong>Nombre:</strong> {{ tagInfo.activo.nombre || 'No disponible' }}</p>
                <p><strong>Descripción:</strong> {{ tagInfo.activo.descripcion || 'No disponible' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>ID Tag:</strong> {{ tagInfo.id }}</p>
                <p><strong>Fecha registro:</strong> {{ formatTimestamp(tagInfo.timestamp) }}</p>
              </div>
            </div>
            
            <h6>Datos de Bodega</h6>
            <div v-if="tagInfo.activo.bodega" class="row">
              <div class="col-md-6">
                <p><strong>Nombre:</strong> {{ tagInfo.activo.bodega.nombre }}</p>
                <p><strong>Área:</strong> {{ tagInfo.activo.bodega.area || 'No disponible' }}</p>
                <p><strong>Tipo:</strong> {{ tagInfo.activo.bodega.tipo || 'No disponible' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Responsable:</strong> {{ tagInfo.activo.bodega.responsable || 'No disponible' }}</p>
                <p><strong>Tipo de activos:</strong> {{ tagInfo.activo.bodega.tipoActivos || 'No disponible' }}</p>
              </div>
            </div>
            <div v-else class="alert alert-warning">
              Este activo no tiene bodega asignada
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="rfid && !loading" class="alert alert-warning">
        No se encontró información para el RFID: {{ rfid }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, watch, onMounted, onUnmounted } from 'vue'
  import { db } from '../firebase'
  import { doc, getDoc } from 'firebase/firestore'
  import MenuInventario from '../components/MenuInventario.vue'
  import { useRoute } from 'vue-router'
  
  export default {
    name: 'RFIDReaderView',
    components: { MenuInventario },
    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      const rfid = ref('')
      const tagInfo = ref(null)
      const loading = ref(false)
      const readingStatus = ref('Esperando lectura...')
      // obtener query params
      const route = useRoute()
      
      // Función para manejar la lectura del RFID
      function handleAppendTag(tagData) {
        console.log("Nuevo tag recibido:", tagData)
        try {
          const tagObj = typeof tagData === "string" ? JSON.parse(tagData) : tagData
          if (tagObj && tagObj.tag) {
            rfid.value = tagObj.tag
            readingStatus.value = 'Tag leído correctamente'
            console.log("RFID actualizado a:", rfid.value)
          } else {
            console.error("El objeto recibido no tiene la propiedad 'tag'")
            readingStatus.value = 'Error: Formato de tag incorrecto'
          }
        } catch (error) {
          console.error("Error en appendTag:", error)
          readingStatus.value = 'Error al procesar tag'
        }
      }
      
      // Función para formatear timestamp
      const formatTimestamp = (timestamp) => {
        if (!timestamp) return "No disponible"
        // Si es Timestamp de Firestore
        if (timestamp.seconds) {
          const date = new Date(timestamp.seconds * 1000)
          return date.toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
        // Si ya es una cadena
        return timestamp
      }
      
      // Función para buscar el tag en Firestore
      const fetchTagInfo = async (rfidValue) => {
        if (!rfidValue) return
        
        loading.value = true
        tagInfo.value = null
        readingStatus.value = `Buscando información para RFID: ${rfidValue}`
        
        try {
          const tagDoc = doc(db, 'businesses', businessId, "tagsMovil", rfidValue)
          const tagSnap = await getDoc(tagDoc)
          
          if (tagSnap.exists()) {
            tagInfo.value = { id: tagSnap.id, ...tagSnap.data() }
            readingStatus.value = 'Información encontrada'
          } else {
            readingStatus.value = 'Tag no encontrado en la base de datos'
          }
        } catch (error) {
          console.error("Error al buscar tag:", error)
          readingStatus.value = 'Error al consultar la base de datos'
        } finally {
          loading.value = false
        }
      }
      
      // Watcher para detectar cambios en el RFID
      watch(rfid, (newRfid) => {
        if (newRfid) {
          fetchTagInfo(newRfid)
        }
      })
      
      // Configuración del lector al montar el componente
      onMounted(() => {
        window.appendTag = handleAppendTag
        readingStatus.value = 'Lector listo - Escanee un tag'
        // si la URL trae ?tag=XXX, lo asignamos a rfid
       const urlTag = route.query.tag
       if (urlTag) {
         rfid.value = urlTag
       }
      })
      
      // Limpieza al desmontar el componente
      onUnmounted(() => {
        window.appendTag = null
        console.log("Callbacks de RFID removidos")
      })
      
      return {
        rfid,
        tagInfo,
        loading,
        readingStatus,
        formatTimestamp
      }
    }
  }
  </script>
  
  <style scoped>
  .card {
    margin-bottom: 5px;
  }
  .card-header {
    font-weight: bold;
  }
  .alert {
    margin-bottom: 5px;
  }
  .spinner-border {
    width: 3rem;
    height: 3rem;
  }
  </style>