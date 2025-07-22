<template>
    <MenuInventario/>
  <div class="rfid-container">
    <!-- Controles -->
    <div class="d-flex gap-2">
      <button 
        @click="toggleReadAllRFID" 
        :class="['btn', readingAll ? 'btn-danger' : 'btn-primary']"
      >
        {{ readingAll ? 'Detener Lectura' : 'Iniciar Lectura' }}
      </button>
      <button 
        @click="clearResults" 
        class="btn btn-secondary"
        :disabled="allRFIDList.length === 0"
      >
        Limpiar
      </button>
    </div>

    <!-- Tags conocidos (con información en DB) -->
    <div v-if="knownTags.length > 0" class="mb-5">
      <h3 class="mb-3">Activos Identificados</h3>
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
            <tr>
              <th @click="sortBy('activo.nombre')" class="sortable">Activo</th>
              <th @click="sortBy('activo.bodega.nombre')" class="sortable">Bodega</th>
              <th @click="sortBy('activo.estado')" class="sortable">Estado</th>
              <!--<th>RFID</th>
              <th>Lecturas</th>-->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in sortedKnownTags" :key="'known-'+index">
              <td>{{ item.activo?.nombre || 'Desconocido' }}</td>
              <td>{{ item.activo?.bodega?.nombre || 'Sin asignar' }}</td>
              <td>
                <span :class="['badge', getStatusClass(item.activo?.estado)]">
                  {{ item.activo?.estado || 'NA' }}
                </span>
              </td>
              <!--<td>{{ item.tag }}</td>
              <td>{{ item.totalCount }}</td>-->
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tags desconocidos -->
    <div v-if="unknownTags.length > 0">
      <h3 class="mb-3">Tags no Identificados</h3>
      <div class="alert alert-warning">
        Se encontraron {{ unknownTags.length }} tags que no existen en la base de datos
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead>
            <tr>
              <th>RFID</th>
              <th>Lecturas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in unknownTags" :key="'unknown-'+index">
              <td>{{ item.tag }}</td>
              <td>{{ item.totalCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!readingAll && allRFIDList.length === 0" class="alert alert-info">
      No se han leído tags. Presione "Iniciar Lectura RFID" para comenzar.
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import MenuInventario from '../components/MenuInventario.vue'

export default {
  name: 'EnhancedRFIDReader',
  components: { MenuInventario },
  setup() {
    const businessId = localStorage.getItem('businessId') || ''
    const readingAll = ref(false)
    const allRFIDList = ref([])
    const knownTags = ref([])
    const unknownTags = ref([])
    const sortField = ref('activo.bodega.nombre')
    const sortDirection = ref('asc')

    // Función para alternar la lectura
    const toggleReadAllRFID = () => {
      if (!readingAll.value) {
        if (window.AndroidInterface?.readRFID) {
          console.log("Iniciando lectura completa de RFID")
          window.AndroidInterface.readRFID()
          readingAll.value = true
          allRFIDList.value = []
        } else {
          console.error("AndroidInterface.readRFID no está disponible")
          alert("Función de lectura no disponible en este dispositivo")
        }
      } else {
        if (window.AndroidInterface?.stopRFID) {
          console.log("Deteniendo lectura completa de RFID")
          window.AndroidInterface.stopRFID()
        }
        readingAll.value = false
      }
    }

    // Limpiar resultados
    const clearResults = () => {
      allRFIDList.value = []
      knownTags.value = []
      unknownTags.value = []
    }

    // Clases para estados
    const getStatusClass = (status) => {
      const statusMap = {
        'activo': 'bg-success',
        'inactivo': 'bg-secondary',
        'mantenimiento': 'bg-warning text-dark',
        'baja': 'bg-danger',
        'default': 'bg-info text-dark'
      }
      return statusMap[status?.toLowerCase()] || statusMap.default
    }

    // Ordenar tabla
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortDirection.value = 'asc'
      }
    }

    // Obtener información del tag desde Firestore
    const fetchTagInfo = async (rfid) => {
      try {
        const tagDoc = doc(db, 'businesses', businessId, "tags", rfid)
        const tagSnap = await getDoc(tagDoc)
        return tagSnap.exists() ? { id: tagSnap.id, ...tagSnap.data() } : null
      } catch (error) {
        console.error("Error al buscar tag:", error)
        return null
      }
    }

    // Procesar tags agrupados
    const groupedRFID = computed(() => {
      const groups = {}
      allRFIDList.value.forEach((item) => {
        if (groups[item.tag]) {
          groups[item.tag].totalCount += item.readCount
        } else {
          groups[item.tag] = { ...item, totalCount: item.readCount }
        }
      })
      return Object.values(groups)
    })

    // Separar tags conocidos y desconocidos
    const processTags = async () => {
      knownTags.value = []
      unknownTags.value = []
      
      for (const item of groupedRFID.value) {
        const tagInfo = await fetchTagInfo(item.tag)
        if (tagInfo) {
          knownTags.value.push({ ...item, ...tagInfo })
        } else {
          unknownTags.value.push(item)
        }
      }
    }

    // Ordenar tags conocidos
    const sortedKnownTags = computed(() => {
      return [...knownTags.value].sort((a, b) => {
        const getValue = (obj, path) => path.split('.').reduce((o, p) => o?.[p], obj)
        const aValue = getValue(a, sortField.value) || ''
        const bValue = getValue(b, sortField.value) || ''
        
        if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
        return 0
      })
    })

    // Manejador de tags recibidos
    const handleDisplayRFIDAll = (data) => {
      if (readingAll.value) {
        try {
          allRFIDList.value = JSON.parse(data)
          processTags()
        } catch (error) {
          console.error("Error al parsear RFID completo:", error)
        }
      }
    }

    // Manejador de tags individuales
    const handleAppendTag = (tagData) => {
      if (readingAll.value) {
        try {
          const tag = typeof tagData === "string" ? JSON.parse(tagData) : tagData
          allRFIDList.value.push(tag)
          // Procesamos cada nuevo tag inmediatamente
          fetchTagInfo(tag.tag).then(tagInfo => {
            if (tagInfo) {
              knownTags.value.push({ ...tag, ...tagInfo })
            } else {
              unknownTags.value.push(tag)
            }
          })
        } catch (error) {
          console.error("Error en appendTag:", error)
        }
      }
    }

    // Manejador de detención
    const handleReadingStopped = () => {
      readingAll.value = false
      processTags()
    }

    // Configuración al montar el componente
    onMounted(() => {
      window.appendTag = handleAppendTag
      window.displayRFIDAll = handleDisplayRFIDAll
      window.readingStopped = handleReadingStopped
    })

    // Limpieza al desmontar
    onUnmounted(() => {
      if (readingAll.value && window.AndroidInterface?.stopRFID) {
        window.AndroidInterface.stopRFID()
      }
      window.appendTag = null
      window.displayRFIDAll = null
      window.readingStopped = null
    })

    return {
      readingAll,
      allRFIDList,
      knownTags,
      unknownTags,
      sortedKnownTags,
      toggleReadAllRFID,
      clearResults,
      sortBy,
      getStatusClass
    }
  }
}
</script>

<style scoped>
.rfid-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.sortable {
  cursor: pointer;
  position: relative;
}

.sortable:hover {
  background-color: #f8f9fa;
}

.table-responsive {
  overflow-x: auto;
}

.badge {
  font-size: 0.85em;
  padding: 0.35em 0.65em;
}

.controls {
  margin-bottom: 2rem;
}
</style>