<template>
  <MenuInventario/>
  <div class="container mt-4">
    <h2 class="mb-4">Gestión de Activos</h2>
    
    <!-- Buscador -->
    <div class="mb-3">
      <input v-model="searchQuery" type="text" class="form-control" placeholder="Buscar por activo o bodega...">
    </div>
    
    <!-- Tabla de Tags -->
    <table class="table table-bordered table-hover">
      <thead class="table-light">
        <tr>
          <th @click="sortBy('activo.nombre')" style="cursor:pointer">
            Activo
            <span v-if="sortKey === 'activo.nombre'">{{ sortOrderSymbol }}</span>
          </th>
          <th @click="sortBy('activo.descripcion')" style="cursor:pointer">
            Descripción
            <span v-if="sortKey === 'activo.descripcion'">{{ sortOrderSymbol }}</span>
          </th>
          <th @click="sortBy('activo.bodega.nombre')" style="cursor:pointer">
            Bodega
            <span v-if="sortKey === 'activo.bodega.nombre'">{{ sortOrderSymbol }}</span>
          </th>
         <!-- <th @click="sortBy('id')" style="cursor:pointer">
            RFID (ID)
            <span v-if="sortKey === 'id'">{{ sortOrderSymbol }}</span>
          </th>-->
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tag in filteredTags" :key="tag.id" @click="openModal(tag)" style="cursor:pointer">
          <td>{{ tag.activo.nombre }}</td>
          <td>{{ tag.activo.descripcion }}</td>
          <td>{{ tag.activo.bodega ? tag.activo.bodega.nombre : 'Sin bodega' }}</td>
          <!--<td>{{ tag.id }}</td>-->
          <td>
            <!-- Botones para editar/eliminar; evitan la propagación del click para no abrir el modal -->
            <button class="btn btn-sm btn-warning me-1" @click.stop="editTag(tag)">Editar</button>
            <button class="btn btn-sm btn-danger" @click.stop="deleteTag(tag)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <!-- Modal de Detalle (y edición opcional) -->
    <div v-if="showModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Tag</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <h6>Activo</h6>
            <p><strong>Nombre:</strong> {{ currentTag.activo.nombre }}</p>
            <p><strong>Descripción:</strong> {{ currentTag.activo.descripcion }}</p>
            <h6>Bodega</h6>
            <p v-if="currentTag.activo.bodega">
              <strong>Nombre:</strong> {{ currentTag.activo.bodega.nombre }}<br>
              <strong>Área:</strong> {{ currentTag.activo.bodega.area }}<br>
              <strong>Cantidad de Activos:</strong> {{ currentTag.activo.bodega.cantidadActivos }}<br>
              <strong>Observaciones:</strong> {{ currentTag.activo.bodega.observaciones }}<br>
              <strong>Responsable:</strong> {{ currentTag.activo.bodega.responsable }}<br>
              <strong>Tipo:</strong> {{ currentTag.activo.bodega.tipo }}<br>
              <strong>Tipo de Activos:</strong> {{ currentTag.activo.bodega.tipoActivos }}
            </p>
            <p v-else>
              Sin bodega asignada.
            </p>
            <h6>Tag</h6>
            <p><strong>ID (RFID):</strong> {{ currentTag.id }}</p>
            <p><strong>Timestamp:</strong> {{ formatTimestamp(currentTag.timestamp) }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Cerrar</button>
            <!-- Puedes agregar botones para editar el registro aquí -->
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="updateTag">
            <div class="modal-header">
              <h5 class="modal-title">Editar Tag</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">ID (RFID)</label>
                <input v-model="editTagData.id" type="text" class="form-control" disabled/>
              </div>
              <div class="mb-3">
                <label class="form-label">Nombre del Activo</label>
                <input v-model="editTagData.activo.nombre" type="text" class="form-control" required/>
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea v-model="editTagData.activo.descripcion" class="form-control" required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Bodega</label>
                <select v-model="editTagData.activo.bodega" class="form-select">
                  <option :value="null">Sin bodega</option>
                  <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega">
                    {{ bodega.nombre }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-primary" @click="printEtiqueta(editTagData)">
                Imprimir Etiqueta
              </button>
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore'
import MenuInventario from '../components/MenuInventario.vue'
import QRCode from 'qrcode'

export default {
  name: 'FirestoreView',
  components: { MenuInventario },
  setup() {
    const businessId = localStorage.getItem('businessId') || ''
    const tags = ref([])
    const bodegas = ref([]) // Nuevo ref para almacenar las bodegas
    const searchQuery = ref("")
    const sortKey = ref("timestamp")
    const sortOrder = ref("desc")
    const showModal = ref(false)
    const showEditModal = ref(false)
    const currentTag = ref(null)
    const editTagData = ref({
      id: '',
      activo: {
        nombre: '',
        descripcion: '',
        bodega: null // Ahora almacenamos el objeto completo de bodega o null
      }
    })
    // Carga las bodegas desde Firestore
    const fetchBodegas = async () => {
      try {
        const q = query(collection(db, 'businesses', businessId, "bodegas"))
        const querySnapshot = await getDocs(q)
        bodegas.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error("Error al cargar bodegas:", error)
      }
    }
    
    // Carga inicial de datos
    onMounted(() => {
      // Crea la query para ordenar por timestamp descendente por defecto
      const q = query(collection(db, 'businesses', businessId, "tags"), orderBy("timestamp", "desc"))
      
      onSnapshot(q, (snapshot) => {
        tags.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      })
      
      // Cargar las bodegas al montar el componente
      fetchBodegas()
    })

      /**
      * Genera e imprime dos etiquetas (40×29.5 mm c/u, separación 3 mm):
      *   1) QR con la URL dinámica
      *   2) Texto: Tag, Nombre y Bodega
      */
     const printEtiqueta = async (tagData) => {
       const tagId = tagData.id
       if (!tagId) {
         alert('Este registro no tiene un RFID asignado.')
         return
       }
       // URL base + query
       const base = window.location.origin
       const url = `${base}/inventario/verActivo?tag=${tagId}`
       try {
         // Data URL del QR
         const qrDataUrl = await QRCode.toDataURL(url, { margin: 1 })
 
         // HTML para imprimir
         const html = `
          <html>
            <head>
              <style>
                @media print {
                  /* Página de 88×29.5 mm sin márgenes */
                  @page { size: 88mm 29.5mm; margin: 0; }
                  html, body {
                    margin: 0; padding: 0;
                    width: 88mm; height: 29.5mm;
                    overflow: hidden; /* evita cualquier contenido extra */
                  }
                  /* No partir dentro de una etiqueta */
                  .label { page-break-inside: avoid; }
                }

                /* Estilos generales */
                body { margin: 0; padding: 0; }
                .label {
                  display: inline-block;
                  vertical-align: top;  /* <<< Alinea al tope */
                  box-sizing: border-box;
                  width: 40mm;
                  height: 29.5mm;
                  text-align: left;
                  font-family: sans-serif;
                }
                /* separación de 3 mm entre las dos etiquetas */
                .label + .label { margin-left: 0mm; }

                .qr {
                  width: 26mm;
                  height: 26mm;
                  margin: 0mm 0 0 6mm;
                }
                .info {
                  margin: 1.5mm;
                  font-size: 8pt;
                  line-height: 1.2;
                }
              </style>
            </head>
            <body>
              <div class="label">
                <img src="${qrDataUrl}" class="qr"/>
              </div>
              <div class="label">
                <div class="info">
                  <div><strong>Tag:</strong> ${tagId}</div>
                  <div><strong>Nombre:</strong> ${tagData.activo.nombre}</div>
                  <div><strong>Bodega:</strong> ${tagData.activo.bodega?.nombre || '–'}</div>
                </div>
              </div>
            </body>
          </html>
          `;

        const win = window.open('', '_blank')
        win.document.write(html)
        win.document.close()
        win.focus()
        setTimeout(() => win.print(), 300)
      } catch (err) {
        console.error('Error generando etiqueta:', err)
        alert('No se pudo generar la etiqueta: ' + err.message)
      }
    }
    
    // Computed para filtrar y ordenar los tags
    const filteredTags = computed(() => {
      let filtered = tags.value.filter(tag => {
        const qLower = searchQuery.value.toLowerCase()
        // Filtramos por activo.nombre, activo.descripcion o nombre de bodega
        const activoNombre = tag.activo?.nombre?.toLowerCase() || ""
        const activoDesc = tag.activo?.descripcion?.toLowerCase() || ""
        const bodegaNombre = tag.activo?.bodega?.nombre?.toLowerCase() || ""
        return activoNombre.includes(qLower) || activoDesc.includes(qLower) || bodegaNombre.includes(qLower)
      })
      
      // Función simple para obtener el valor de la propiedad (puede ser anidada)
      const getValue = (obj, key) => {
        return key.split('.').reduce((o, i) => (o ? o[i] : ""), obj)
      }
      
      filtered.sort((a, b) => {
        const aVal = getValue(a, sortKey.value)
        const bVal = getValue(b, sortKey.value)
        if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
        return 0
      })
      
      return filtered
    })
    
    const sortBy = (key) => {
      if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortKey.value = key
        sortOrder.value = 'asc'
      }
    }
    
    const sortOrderSymbol = computed(() => (sortOrder.value === 'asc' ? '↑' : '↓'))
    
    const openModal = (tag) => {
      currentTag.value = tag
      showModal.value = true
    }
    
    const closeModal = () => {
      showModal.value = false
      currentTag.value = null
    }
    
    // Función para formatear timestamp (adaptar según formato de Firestore)
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return ""
      // Si es Timestamp de Firestore, tiene un método toDate()
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    }
    
    // Ejemplo de función para eliminar un tag (CRUD Delete)
    const deleteTag = async (tag) => {
      if (confirm(`¿Está seguro de eliminar el tag con RFID: ${tag.id}?`)) {
        try {
          const tagDoc = doc(db, 'businesses', businessId, "tags", tag.id)
          await deleteDoc(tagDoc)
        } catch (error) {
          console.error("Error al eliminar tag:", error)
        }
      }
    }

    const editTag = (tag) => {
      // Creamos una copia profunda del tag para editar
      editTagData.value = JSON.parse(JSON.stringify(tag))
      showEditModal.value = true
    }

        // Función para actualizar el tag en Firestore
    const updateTag = async () => {
      try {
        const tagDoc = doc(db, 'businesses', businessId, "tags", editTagData.value.id)
        
        // Preparamos los datos a actualizar
        const updateData = {
          activo: {
            nombre: editTagData.value.activo.nombre,
            descripcion: editTagData.value.activo.descripcion,
            bodega: editTagData.value.activo.bodega
          },
          // Mantenemos el timestamp original o actualizamos si lo deseas
          //timestamp: editTagData.value.timestamp
        }
        
        await updateDoc(tagDoc, updateData)
        closeEditModal()
      } catch (error) {
        console.error("Error al actualizar tag:", error)
        alert("Ocurrió un error al actualizar el tag")
      }
    }
    

    // Función para cerrar el modal de edición
    const closeEditModal = () => {
      showEditModal.value = false
      editTagData.value = {
        id: '',
        activo: {
          nombre: '',
          descripcion: '',
          bodega: {
            nombre: '',
            area: '',
            responsable: ''
          }
        }
      }
    }
    
    return {
      tags,
      searchQuery,
      filteredTags,
      sortBy,
      sortOrderSymbol,
      openModal,
      closeModal,
      currentTag,
      formatTimestamp,
      deleteTag,
      editTag,
      sortKey,
      sortOrder,
      showModal,
      showEditModal,
      editTagData,
      closeEditModal,
      updateTag,
      bodegas,
      printEtiqueta
    }
  }
}
</script>

<style>
html, body {
  margin: 5px;
  padding: 0rem;
}
.modal {
  /* Asegúrate de que el modal tenga scroll interno si el contenido es extenso */
  overflow-y: auto;
}
.mt-5 {
    margin-top: 1rem !important;
  }
</style>
