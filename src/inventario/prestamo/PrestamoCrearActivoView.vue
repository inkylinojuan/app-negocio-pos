<template>
    <MenuInventario/>
      <div class="container mt-5">
        <h2 class="mb-4">Ingresar Activos Préstamo / Alquiler</h2>
        
        <!-- Pestañas de navegación -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a href="#" 
               class="nav-link" 
               :class="{ active: activeTab === 'activos' }"
               @click.prevent="activeTab = 'activos'">
              Activos por Asignar TAGS
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
                <th>Código Interno</th>
                <th>Descripción</th>
                <th>Ubicación Asignada</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activo in filteredActivos" :key="activo.id">
                <td>{{ activo.nombre }}</td>
                <td>{{ activo.codigoInterno || 'N/A' }}</td>
                <td>{{ activo.descripcion }}</td>
                <td>{{ activo.ubicacion ? activo.ubicacion.name : 'Sin asignar' }}</td>
                <td>{{ activo.category ? activo.category.name : 'Sin asignar' }}</td>
                <td>
                  <button class="btn btn-sm btn-info me-1" @click="openAssignRFIDModal(activo)">RFID</button>
                  <button class="btn btn-sm btn-warning me-1" @click="openEditActivoModal(activo)">Editar</button>
                  <button class="btn btn-sm btn-danger" @click="showConfirmDelete(activo)">X</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pestaña Importación y Asignación -->
        <div v-if="activeTab === 'importacion'">
            <!-- Asignación en bloque de Ubicación y Categoría -->
            <div class="mb-3">
                <label class="form-label">Asignar Ubicación en Bloque</label>
                <select v-model="selectedUbicacionBulk" class="form-select" required>
                <option disabled value="">Seleccione una ubicación</option>
                <option v-for="ubicacion in ubicaciones" :key="ubicacion.id" :value="ubicacion">
                    {{ ubicacion.name }}
                </option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label">Asignar Categoría en Bloque</label>
                <select v-model="selectedCategoryBulk" class="form-select" required>
                <option disabled value="">Seleccione una categoría</option>
                <option v-for="category in categories" :key="category.id" :value="category">
                    {{ category.name }}
                </option>
                </select>
            </div>

            <!-- Importar activos por CSV -->
            <div class="mb-3">
                <label class="form-label">Importar activos (CSV)</label>
                <input 
                type="file" 
                @change="handleFileUpload" 
                accept=".csv, application/vnd.ms-excel" 
                class="form-control"
                :disabled="!selectedUbicacionBulk || !selectedCategoryBulk"
                />
            </div>
          
          <!-- Botón para agregar un activo individual -->
          <div class="mb-3">
            <button class="btn btn-secondary" @click="openCreateModal">
              Agregar Activo Individual
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
                  />
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
                    <label class="form-label">Código Interno</label>
                    <input v-model="currentActivo.codigoInterno" type="text" class="form-control"/>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <textarea v-model="currentActivo.descripcion" class="form-control" required></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Ubicación Asignada</label>
                    <select v-model="currentActivo.ubicacionId" class="form-select">
                      <option disabled value="">Seleccione una ubicación</option>
                      <option v-for="ubicacion in ubicaciones" :key="ubicacion.id" :value="ubicacion.id">
                        {{ ubicacion.name }}
                      </option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Categoría</label>
                    <select v-model="currentActivo.categoryId" class="form-select">
                      <option disabled value="">Seleccione una categoría</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
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
                    <label class="form-label">Código Interno</label>
                    <input v-model="newActivo.codigoInterno" type="text" class="form-control"/>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <textarea v-model="newActivo.descripcion" class="form-control" required></textarea>
                  </div>
                  <div class="mb-3">
                      <label class="form-label">Ubicación Asignada</label>
                      <select v-model="newActivo.ubicacionId" class="form-select">
                          <option disabled value="">Seleccione una ubicación</option>
                          <option v-for="ubicacion in ubicaciones" :key="ubicacion.id" :value="ubicacion.id">
                              {{ ubicacion.name }}
                          </option>
                      </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Categoría</label>
                    <select v-model="newActivo.categoryId" class="form-select">
                      <option disabled value="">Seleccione una categoría</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
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
  
        <!-- Custom Message/Confirmation Modal -->
        <div v-if="showCustomModal" class="modal d-block" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ customModalTitle }}</h5>
                    <button type="button" class="btn-close" @click="handleCustomModalAction(false)"></button>
                </div>
                <div class="modal-body">
                    <p>{{ customModalMessage }}</p>
                </div>
                <div class="modal-footer">
                    <button 
                    v-if="customModalType === 'confirm'" 
                    type="button" 
                    class="btn btn-secondary" 
                    @click="handleCustomModalAction(false)"
                    >
                    Cancelar
                    </button>
                    <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="handleCustomModalAction(true)"
                    >
                    {{ customModalType === 'confirm' ? 'Aceptar' : 'Cerrar' }}
                    </button>
                </div>
                </div>
            </div>
            </div>
        
      </div>
    </template>
    
    <script>
    import { ref, computed, onMounted, onUnmounted } from 'vue'
    import Papa from 'papaparse'
    import { db } from '../../firebase'
    import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore'
    import MenuInventario from '../../components/MenuInventario.vue'
    import QRCode from 'qrcode'
  
    export default {
      name: 'ManageActivos',
      components: { MenuInventario },
  
      setup() {
        const businessId = localStorage.getItem('businessId') || ''
        // Colecciones de Firebase
        const activosCol = collection(db, 'businesses', businessId, "activosMovil")
        const ubicacionesCol = collection(db, 'businesses', businessId, "ubicaciones") // Renombrado de bodegasCol
        const categoriesCol = collection(db, 'businesses', businessId, "loanCategories") // Nueva colección para categorías
        const tagsCol = collection(db, 'businesses', businessId, "tags")
        
        // Reactivos para activos, ubicaciones, categorías y búsqueda
        const activos = ref([])
        const ubicaciones = ref([]) // Renombrado de bodegas
        const categories = ref([]) // Nuevo ref para categorías
        const searchQuery = ref("")
        const selectedUbicacionBulk = ref(null) // Renombrado de selectedBodegaBulk
        const selectedCategoryBulk = ref(null) // Nuevo ref para categoría en bloque
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
          codigoInterno: '', // Nuevo campo
          descripcion: '',
          ubicacion: null, 
          ubicacionId: '', // Para el v-model del select
          category: null, // Nuevo campo
          categoryId: '', // Para el v-model del select
          createdAt: serverTimestamp()
        })
  
        // Custom Message/Confirmation Modal
        const showCustomModal = ref(false)
        const customModalTitle = ref('')
        const customModalMessage = ref('')
        const customModalType = ref('alert') // 'alert' or 'confirm'
        let customModalResolve = () => {}
        let customModalReject = () => {}
  
        const openCustomModal = (title, message, type = 'alert') => {
            customModalTitle.value = title
            customModalMessage.value = message
            customModalType.value = type
            showCustomModal.value = true
            
            return new Promise((resolve) => {
                customModalResolve = resolve
            })
        }

        const handleCustomModalAction = (result) => {
            showCustomModal.value = false
            if (customModalResolve) {
                customModalResolve(result)
                customModalResolve = null
            }
        }

        const closeCustomModal = () => {
          showCustomModal.value = false
          if (customModalType.value === 'alert') {
            customModalResolve()
          } else {
            customModalReject()
          }
        }
        
        // Función para cargar activos, ubicaciones y categorías
        const fetchActivos = async () => {
          try {
            const snap = await getDocs(activosCol)
            activos.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          } catch (error) {
            console.error("Error al cargar activos:", error)
            openCustomModal('Error', 'Error al cargar los activos: ' + error.message)
          }
        }
        const fetchUbicaciones = async () => { // Renombrado de fetchBodegas
          try {
            const snap = await getDocs(ubicacionesCol)
            ubicaciones.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            console.log("Ubicaciones cargadas:", ubicaciones.value)
          } catch (error) {
            console.error("Error al cargar ubicaciones:", error)
            openCustomModal('Error', 'Error al cargar las ubicaciones: ' + error.message)
          }
        }
  
        const fetchCategories = async () => { // Nueva función para cargar categorías
          try {
            const snap = await getDocs(categoriesCol)
            categories.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            console.log("Categorías cargadas:", categories.value)
          } catch (error) {
            console.error("Error al cargar categorías:", error)
            openCustomModal('Error', 'Error al cargar las categorías: ' + error.message)
          }
        }
        
        onMounted(() => {
          fetchActivos()
          fetchUbicaciones()
          fetchCategories() // Cargar categorías al montar
          window.appendTag = handleAppendTag
        })
        
        onUnmounted(() => {
          window.appendTag = null
          console.log("Callbacks de Android removidos")
        })
  
              /**
        * Genera e imprime dos etiquetas (40×29.5 mm c/u, separación 3 mm):
        * 1) QR con la URL dinámica
        * 2) Texto: Tag, Nombre y Ubicación
        */
       const printEtiqueta = async (tagData) => {
         const tagId = tagData.id
         if (!tagId) {
           openCustomModal('Error', 'Este registro no tiene un RFID asignado.')
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
                    <div><strong>Código:</strong> ${tagData.activo.codigoInterno}</div>
                    <div><strong>Ubicación:</strong> ${tagData.activo.ubicacion?.name || '–'}</div>
                    <div><strong>Categoria:</strong> ${tagData.activo.category?.name || '–'}</div>
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
          openCustomModal('Error', 'No se pudo generar la etiqueta: ' + err.message)
        }
      }
        
        // Computed para filtrar activos según el buscador
        const filteredActivos = computed(() => {
          if (!searchQuery.value) return activos.value
          const query = searchQuery.value.toLowerCase()
          return activos.value.filter(a =>
            a.nombre.toLowerCase().includes(query) ||
            (a.codigoInterno && a.codigoInterno.toLowerCase().includes(query)) ||
            (a.descripcion && a.descripcion.toLowerCase().includes(query)) ||
            (a.ubicacion && a.ubicacion.nombre.toLowerCase().includes(query)) ||
            (a.category && a.category.nombre.toLowerCase().includes(query))
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
              openCustomModal('Error', "El objeto recibido del RFID no tiene la propiedad 'tag'.")
            }
          } catch (error) {
            console.error("Error en appendTag:", error)
            openCustomModal('Error', "Error al procesar el tag RFID: " + error.message)
          }
        }
        
        // CRUD de activos
        const openEditActivoModal = (activo) => {
          currentActivo.value = { ...activo }
          // Asignar IDs para los v-model de los selects
          currentActivo.value.ubicacionId = activo.ubicacion?.id || ""
          currentActivo.value.categoryId = activo.category?.id || ""
          showEditModal.value = true
        }
        const closeEditModal = () => {
          showEditModal.value = false
          currentActivo.value = null
        }
        const updateActivo = async () => {
          try {
              // Buscar y asignar el objeto completo de ubicación
              if (currentActivo.value.ubicacionId) {
                  const selectedUbicacion = ubicaciones.value.find(u => u.id === currentActivo.value.ubicacionId)
                  currentActivo.value.ubicacion = selectedUbicacion || null
              } else {
                  currentActivo.value.ubicacion = null
              }
  
              // Buscar y asignar el objeto completo de categoría
              if (currentActivo.value.categoryId) {
                  const selectedCategory = categories.value.find(c => c.id === currentActivo.value.categoryId)
                  currentActivo.value.category = selectedCategory || null
              } else {
                  currentActivo.value.category = null
              }
              
              const activoDoc = doc(db, 'businesses', businessId, "activosMovil", currentActivo.value.id)
              await updateDoc(activoDoc, { 
                  nombre: currentActivo.value.nombre,
                  codigoInterno: currentActivo.value.codigoInterno || '',
                  descripcion: currentActivo.value.descripcion,
                  ubicacion: currentActivo.value.ubicacion,
                  category: currentActivo.value.category
              })
              await fetchActivos()
              closeEditModal()
              openCustomModal('Éxito', 'Activo actualizado correctamente.')
          } catch (error) {
              console.error("Error al actualizar activo:", error)
              openCustomModal('Error', 'Error al actualizar activo: ' + error.message)
          }
        }
  
        const showConfirmDelete = async (activo) => {
          const result = await openCustomModal(
            'Confirmar Eliminación',
            `¿Está seguro de eliminar el activo ${activo.nombre}?`,
            'confirm'
          )
          if (result) {
            console.log("Eliminando activo:", activo)
            deleteActivo(activo)
          }
        }
  
        const deleteActivo = async (activo) => {
            try {
              const activoDoc = doc(db, 'businesses', businessId, "activosMovil", activo.id)
              await deleteDoc(activoDoc)
              await fetchActivos()
              openCustomModal('Éxito', 'Activo eliminado correctamente.')
            } catch (error) {
              console.error("Error al eliminar activo:", error)
              openCustomModal('Error', 'Error al eliminar activo: ' + error.message)
            }
        }
        
        // Importación de CSV
        const handleFileUpload = (event) => {
            if (!selectedUbicacionBulk.value || !selectedCategoryBulk.value) {
                openCustomModal('Error', 'Debe seleccionar una ubicación y categoría antes de importar');
                return;
            }

            const file = event.target.files[0];
            if (file) {
                Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async function(results) {
                    const parsedData = results.data;
                    let importCount = 0;
                    let errorCount = 0;
                    
                    for (const row of parsedData) {
                    try {
                        // Validar campos mínimos
                        if (!row.nombre) {
                        errorCount++;
                        continue;
                        }
                        
                        await addDoc(activosCol, {
                        nombre: row.nombre || '',
                        codigoInterno: row.codigoInterno || '',
                        descripcion: row.descripcion || '',
                        ubicacion: selectedUbicacionBulk.value,
                        category: selectedCategoryBulk.value,
                        createdAt: serverTimestamp()
                        });
                        importCount++;
                    } catch (error) {
                        console.error("Error al importar activo:", error);
                        errorCount++;
                    }
                    }
                    
                    await fetchActivos();
                    
                    // Resetear selecciones
                    selectedUbicacionBulk.value = null;
                    selectedCategoryBulk.value = null;
                    
                    // Mostrar resumen
                    openCustomModal(
                    'Importación Completa',
                    `Se importaron ${importCount} activos${errorCount > 0 ? ` (con ${errorCount} errores)` : ''}`
                    );
                },
                error: function(error) {
                    console.error("Error al parsear CSV:", error);
                    openCustomModal('Error', 'Formato CSV inválido: ' + error.message);
                }
                });
            }
            };
        
        // Asignación en bloque: asigna la ubicación seleccionada a todos los activos sin ubicación
        const assignUbicacionBulk = async () => { // Renombrado de assignBodegaBulk
          if (!selectedUbicacionBulk.value) {
            openCustomModal('Advertencia', "Seleccione una ubicación para asignar")
            return
          }
          try {
            for (const activo of activos.value) {
              // Solo actualiza si el activo no tiene una ubicación asignada
              if (!activo.ubicacion || activo.ubicacion.id !== selectedUbicacionBulk.value.id) {
                const activoDoc = doc(db, 'businesses', businessId, "activosMovil", activo.id)
                await updateDoc(activoDoc, { ubicacion: selectedUbicacionBulk.value })
              }
            }
            await fetchActivos()
            openCustomModal('Éxito', "Ubicación asignada en bloque correctamente.")
          } catch (error) {
            console.error("Error en asignación en bloque:", error)
            openCustomModal('Error', "Error en la asignación en bloque: " + error.message)
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
            openCustomModal('Advertencia', "Debe escanear un RFID")
            return
          }
          try {
            const tagDocRef = doc(db, 'businesses', businessId, "tagsMovil", rfid.value)
            const tagSnap = await getDoc(tagDocRef)
            if (tagSnap.exists()) {
              openCustomModal('Advertencia', "Este RFID ya ha sido asignado a otro activo")
              return
            }
            await setDoc(tagDocRef, {
              tag: rfid.value,
              activo: currentActivo.value,
              status: 'Disponible',
              //ubicacion: currentActivo.value.ubicacion, // Usar ubicacion
              //category: currentActivo.value.category, // Incluir categoría
              timestamp: serverTimestamp()
            })
            // Elimina el activo ya asignado
            const activoDoc = doc(db, 'businesses', businessId, "activosMovil", currentActivo.value.id)
            await deleteDoc(activoDoc)
            await fetchActivos()
            closeAssignModal()
            openCustomModal('Éxito', "RFID asignado y activo movido a tagsMovil.")
          } catch (error) {
            console.error("Error al asignar RFID:", error)
            openCustomModal('Error', "Error al asignar RFID: " + error.message)
          }
        }
        
        // Modal: Crear un activo individual
        const openCreateModal = () => {
          newActivo.value = {
            nombre: '',
            codigoInterno: '',
            descripcion: '',
            ubicacion: null,
            ubicacionId: '',
            category: null,
            categoryId: '',
            createdAt: serverTimestamp()
          }
          showCreateModal.value = true
        }
        const closeCreateModal = () => {
          showCreateModal.value = false
          newActivo.value = {
            nombre: '',
            codigoInterno: '',
            descripcion: '',
            ubicacion: null,
            ubicacionId: '',
            category: null,
            categoryId: '',
            createdAt: serverTimestamp()
          }
        }
        const createActivo = async () => {
          try {
              // Buscar y asignar el objeto completo de ubicación
              if (newActivo.value.ubicacionId) {
                  const selectedUbicacion = ubicaciones.value.find(u => u.id === newActivo.value.ubicacionId)
                  newActivo.value.ubicacion = selectedUbicacion || null
              } else {
                  newActivo.value.ubicacion = null
              }
  
              // Buscar y asignar el objeto completo de categoría
              if (newActivo.value.categoryId) {
                  const selectedCategory = categories.value.find(c => c.id === newActivo.value.categoryId)
                  newActivo.value.category = selectedCategory || null
              } else {
                  newActivo.value.category = null
              }
  
              await addDoc(activosCol, { 
                  nombre: newActivo.value.nombre,
                  codigoInterno: newActivo.value.codigoInterno || '',
                  descripcion: newActivo.value.descripcion,
                  ubicacion: newActivo.value.ubicacion,
                  category: newActivo.value.category,
                  createdAt: serverTimestamp()
              })
              await fetchActivos()
              closeCreateModal()
              openCustomModal('Éxito', "Activo creado correctamente.")
          } catch (error) {
              console.error("Error al crear activo:", error)
              openCustomModal('Error', "Error al crear activo: " + error.message)
          }
        }
  
        return {
          activeTab,
          activos,
          ubicaciones, // Renombrado
          categories, // Nuevo
          searchQuery,
          selectedUbicacionBulk, // Renombrado
          selectedCategoryBulk,
          filteredActivos,
          openEditActivoModal,
          closeEditModal,
          updateActivo,
          showConfirmDelete, // Para el modal de confirmación
          handleFileUpload,
          assignUbicacionBulk, // Renombrado
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
          printEtiqueta,
          // Custom Modal
          showCustomModal,
          customModalTitle,
          customModalMessage,
          customModalType,
          closeCustomModal,
          handleCustomModalAction
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