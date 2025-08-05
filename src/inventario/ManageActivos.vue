<template>
  <MenuInventario/>
    <div class="container mt-5">
      <h2 class="mb-4">Gestión de Activos</h2>
      
      <!-- Pestañas de navegación -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a href="#" 
             class="nav-link" 
             :class="{ active: activeTab === 'activos' }"
             @click.prevent="activeTab = 'activos'">
            Activos
          </a>
        </li>
        <li class="nav-item">
          <a href="#" 
             class="nav-link" 
             :class="{ active: activeTab === 'importacion' }"
             @click.prevent="activeTab = 'importacion'">
            Importación y Asignación
          </a>
        </li>
      </ul>


      
      <!-- Pestaña Activos: Tabla, búsqueda y CRUD -->
      <div v-if="activeTab === 'activos'">
        <!-- Buscador de activos -->
        <div class="mb-3">
          <input v-model="searchQuery" type="text" class="form-control" placeholder="Buscar activo..."/>
        </div>
    


        <!-- Tabla de activos -->
        <table class="table table-striped table-hover">
          <thead class="table-light">
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <!--<th>Bodega Asignada</th>-->
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="activo in filteredActivos" :key="activo.id">
              <td>{{ activo.nombre }}</td>
              <td>{{ activo.descripcion }}</td>
              <!--<td>{{ activo.bodega ? activo.bodega.nombre : 'Sin asignar' }}</td>-->
              <td>
                <button class="btn btn-sm btn-info me-1" @click="openAssignRFIDModal(activo)">RFID</button>
                <button class="btn btn-sm btn-warning me-1" @click="openEditActivoModal(activo)">Editar</button>
                <button class="btn btn-sm btn-danger" @click="deleteActivo(activo)">X</button>
              </td>
            </tr>
          </tbody>
        </table>


      </div>
      
      <!-- Pestaña Importación y Asignación -->
      <div v-if="activeTab === 'importacion'">
        <!-- Importar activos por CSV -->
        <div class="mb-3">
          <label class="form-label">Importar activos (CSV)</label>
          <input type="file" @change="handleFileUpload" accept=".csv, application/vnd.ms-excel" class="form-control"/>
        </div>
        
        <!-- Botón para agregar un activo individual -->
        <div class="mb-3">
          <button class="btn btn-secondary" @click="openCreateModal">
            Agregar Activo Individual
          </button>
        </div>
        
        <!-- Asignación en bloque de Bodega -->
        <div class="mb-3">
          <label class="form-label">Asignar Bodega en Bloque</label>
          <select v-model="selectedBodegaBulk" class="form-select">
            <option disabled value="">Seleccione una bodega</option>
            <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega">
              {{ bodega.nombre }}
            </option>
          </select>
          <button class="btn btn-primary mt-2" @click="assignBodegaBulk" :disabled="!selectedBodegaBulk">
            Asignar Bodega a todos
          </button>
        </div>
      </div>
      


      <!-- Modal para asignar RFID a un activo -->
      <div v-if="showAssignModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Asignar RFID a: {{ currentActivo.nombre }}</h5>
              <button type="button" class="btn-close" @click="closeAssignModal"></button>
            </div>
            <div class="modal-body">
              <p>Escanee el tag RFID para asignar:</p>
                <div class="input-group">
                <span class="input-group-text">RFID:</span>
                <input
                  v-model="rfid"
                  type="text"
                  class="form-control"
                  placeholder="Ingrese o escanee RFID"
                  autofocus
                /><!--@keyup.enter="saveAsignacionRFID"-->
              </div>
            </div>
            <div class="modal-footer">
              <!-- Botón de imprimir etiqueta -->
              <button
                type="button"
                class="btn btn-outline-primary me-auto"
                @click="printEtiqueta({ id: rfid, activo: currentActivo })"
              >
                Imprimir Etiqueta
              </button>
              <button class="btn btn-secondary" @click="closeAssignModal">Cancelar</button>
              <button class="btn btn-primary" @click="saveAsignacionRFID">Guardar Asignación</button>
            </div>
          </div>
        </div>
      </div>
      


      <!-- Modal para editar activo -->
      <div v-if="showEditModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="updateActivo">
              <div class="modal-header">
                <h5 class="modal-title">Editar Activo</h5>
                <button type="button" class="btn-close" @click="closeEditModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre</label>
                  <input v-model="currentActivo.nombre" type="text" class="form-control" required/>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="currentActivo.descripcion" class="form-control" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Bodega Asignada</label>
                  <select v-model="currentActivo.bodegaId" class="form-select">
                    <option disabled value="">Seleccione una bodega</option>
                    <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
                      {{ bodega.nombre }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      </div>


      
      <!-- Modal para crear un activo individual -->
      <div v-if="showCreateModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="createActivo">
              <div class="modal-header">
                <h5 class="modal-title">Crear Activo</h5>
                <button type="button" class="btn-close" @click="closeCreateModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre</label>
                  <input v-model="newActivo.nombre" type="text" class="form-control" required/>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="newActivo.descripcion" class="form-control" required></textarea>
                </div>
                <!-- Cambiamos la vinculación a la bodega -->
                <div class="mb-3">
                    <label class="form-label">Bodega Asignada</label>
                    <select v-model="newActivo.bodega" class="form-select" required>
                    <option disabled value="">Seleccione una bodega</option>
                    <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega">
                        {{ bodega.nombre }}
                    </option>
                    </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeCreateModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
    </div>
    
  </template>
  
  <script>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import Papa from 'papaparse'
  import { db } from '../firebase'
  import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore'
  import MenuInventario from '../components/MenuInventario.vue'
  import QRCode from 'qrcode'

  export default {
    name: 'ManageActivos',
    components: { MenuInventario },

    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      // Colecciones
      const activosCol = collection(db, 'businesses', businessId, "activos")
      const bodegasCol = collection(db, 'businesses', businessId, "bodegas")
      
      // Reactivos para activos, bodegas y búsqueda
      const activos = ref([])
      const bodegas = ref([])
      const searchQuery = ref("")
      const selectedBodegaBulk = ref(null)
      const activeTab = ref("activos")
      
      // Modal para asignar RFID
      const showAssignModal = ref(false)
      const currentActivo = ref(null)
      const rfid = ref("")
      
      // Modal para editar activo
      const showEditModal = ref(false)
      
      // Modal para crear activo individual
      const showCreateModal = ref(false)
      const newActivo = ref({
        nombre: '',
        descripcion: '',
        bodega: null, // si se desea guardar objeto completo o se asigna más adelante
        bodegaId: '',
        createdAt: serverTimestamp()
      })
      
      // Función para cargar activos y bodegas
      const fetchActivos = async () => {
        try {
          const snap = await getDocs(activosCol)
          activos.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        } catch (error) {
          console.error("Error al cargar activos:", error)
        }
      }
      const fetchBodegas = async () => {
        try {
          const snap = await getDocs(bodegasCol)
          bodegas.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        } catch (error) {
          console.error("Error al cargar bodegas:", error)
        }
      }
      
      onMounted(() => {
        fetchActivos()
        fetchBodegas()
        window.appendTag = handleAppendTag
      })
      
      onUnmounted(() => {
        window.displayRFID = null
        window.readingStopped = null
        window.appendTag = null
        console.log("Callbacks removidos")
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
      
      // Computed para filtrar activos según el buscador
      const filteredActivos = computed(() => {
        if (!searchQuery.value) return activos.value
        return activos.value.filter(a =>
          a.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          (a.descripcion && a.descripcion.toLowerCase().includes(searchQuery.value.toLowerCase()))
        )
      })
      
      function handleAppendTag(tagData) {
        console.log("Nuevo tag recibido:", tagData)
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
      
      // CRUD de activos
      const openEditActivoModal = (activo) => {
        currentActivo.value = { ...activo }
        if (activo.bodega && activo.bodega.id) {
          currentActivo.value.bodegaId = activo.bodega.id
        } else {
          currentActivo.value.bodegaId = ""
        }
        showEditModal.value = true
      }
      const closeEditModal = () => {
        showEditModal.value = false
        currentActivo.value = null
      }
      const updateActivo = async () => {
        try {
            // Si se eligió una bodega en el select, buscamos el objeto completo en el array "bodegas"
            if (currentActivo.value.bodegaId) {
            const selectedBodega = bodegas.value.find(b => b.id === currentActivo.value.bodegaId)
            // Asignamos el objeto encontrado a la propiedad "bodega" del activo
            currentActivo.value.bodega = selectedBodega || null
            } else {
            currentActivo.value.bodega = null
            }
            
            const activoDoc = doc(db, 'businesses', businessId, "activos", currentActivo.value.id)
            await updateDoc(activoDoc, { ...currentActivo.value })
            await fetchActivos()
            closeEditModal()
        } catch (error) {
            console.error("Error al actualizar activo:", error)
        }
        }

      const deleteActivo = async (activo) => {
        if (confirm(`¿Está seguro de eliminar el activo ${activo.nombre}?`)) {
          try {
            const activoDoc = doc(db, 'businesses', businessId, "activos", activo.id)
            await deleteDoc(activoDoc)
            await fetchActivos()
          } catch (error) {
            console.error("Error al eliminar activo:", error)
          }
        }
      }
      
      // Importación de CSV
      const handleFileUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
              const parsedData = results.data
              parsedData.forEach(async (row) => {
                try {
                  await addDoc(activosCol, {
                    nombre: row.nombre || '',
                    descripcion: row.descripcion || '',
                    bodega: null,
                    createdAt: serverTimestamp()
                  })
                } catch (error) {
                  console.error("Error al importar activo:", error)
                }
              })
              fetchActivos()
            },
            error: function(error) {
              console.error("Error al parsear CSV:", error)
            }
          })
        }
      }
      
      // Asignación en bloque: asigna la bodega seleccionada a todos los activos sin bodega
      const assignBodegaBulk = async () => {
        if (!selectedBodegaBulk.value) {
          alert("Seleccione una bodega para asignar")
          return
        }
        try {
          for (const activo of activos.value) {
            if (!activo.bodega) {
              const activoDoc = doc(db, 'businesses', businessId, "activos", activo.id)
              await updateDoc(activoDoc, { bodega: selectedBodegaBulk.value })
            }
          }
          await fetchActivos()
          alert("Bodega asignada en bloque correctamente")
        } catch (error) {
          console.error("Error en asignación en bloque:", error)
        }
      }
      
      // Modal: Asignar RFID a un activo
      const openAssignRFIDModal = (activo) => {
        currentActivo.value = { ...activo }
        // Reiniciamos el RFID para que se use el valor real que inyecta Android
        rfid.value = ""
        showAssignModal.value = true
      }
      const closeAssignModal = () => {
        rfid.value = ""
        showAssignModal.value = false
        currentActivo.value = null
      }
      // Guardar asignación de RFID: usar el RFID como id en "tags" y eliminar el activo
      const saveAsignacionRFID = async () => {
        if (!rfid.value) {
          alert("Debe escanear un RFID")
          return
        }
        try {
          const tagDocRef = doc(db, 'businesses', businessId, "tags", rfid.value)
          const tagSnap = await getDoc(tagDocRef)
          if (tagSnap.exists()) {
            alert("Este RFID ya ha sido asignado a otro activo")
            return
          }
          await setDoc(tagDocRef, {
            tag: rfid.value,
            activo: currentActivo.value,
            bodega: currentActivo.value.bodega,
            timestamp: serverTimestamp()
          })
          // Elimina el activo ya asignado
          const activoDoc = doc(db, 'businesses', businessId, "activos", currentActivo.value.id)
          await deleteDoc(activoDoc)
          await fetchActivos()
          closeAssignModal()
          alert("RFID asignado y activo movido a tags")
        } catch (error) {
          console.error("Error al asignar RFID:", error)
          alert("Error al asignar RFID: " + error.message)
        }
      }
      
      // Modal: Crear un activo individual
      const openCreateModal = () => {
        newActivo.value = {
          nombre: '',
          descripcion: '',
          bodega: null,
          bodegaId: '',
          createdAt: serverTimestamp()
        }
        showCreateModal.value = true
      }
      const closeCreateModal = () => {
        showCreateModal.value = false
        newActivo.value = {
          nombre: '',
          descripcion: '',
          bodega: null,
          bodegaId: '',
          createdAt: serverTimestamp()
        }
      }
      const createActivo = async () => {
        try {
            await addDoc(activosCol, { ...newActivo.value, createdAt: serverTimestamp() })
            await fetchActivos()
            closeCreateModal()
            alert("Activo creado correctamente")
        } catch (error) {
            console.error("Error al crear activo:", error)
            alert("Error al crear activo: " + error.message)
        }
        }

      return {
        activeTab,
        activos,
        bodegas,
        searchQuery,
        selectedBodegaBulk,
        filteredActivos,
        openEditActivoModal,
        closeEditModal,
        updateActivo,
        deleteActivo,
        handleFileUpload,
        assignBodegaBulk,
        openAssignRFIDModal,
        closeAssignModal,
        saveAsignacionRFID,
        showAssignModal,
        currentActivo,
        rfid,
        showEditModal,
        // Para la creación individual
        showCreateModal,
        newActivo,
        openCreateModal,
        closeCreateModal,
        createActivo,
        printEtiqueta
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
  