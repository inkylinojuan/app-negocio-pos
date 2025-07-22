<template>
    <MenuInventario/>
    <div class="container mt-4">
      <h2 class="mb-4">Gestión de Activos</h2>
      
    <!-- Pestañas de estado -->
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          href="#"
          class="nav-link"
          :class="{ active: activeTab === 'disponibles' }"
          @click.prevent="selectTab('disponibles')"
        >
          Activos Disponibles
        </a>
      </li>
      <li class="nav-item">
        <a
          href="#"
          class="nav-link"
          :class="{ active: activeTab === 'prestados' }"
          @click.prevent="selectTab('prestados')"
        >
          Activos Prestados
        </a>
      </li>
      <li class="nav-item">
        <a
          href="#"
          class="nav-link"
          :class="{ active: activeTab === 'mantenimiento' }"
          @click.prevent="selectTab('mantenimiento')"
        >
          En Mantenimiento
        </a>
      </li>
    </ul>

    <!-- Buscador y acción batch -->
    <div class="d-flex align-items-center mt-3 mb-3">
      <div class="flex-grow-1">
        <input
          v-model="searchQuery"
          @input="performSearch"
          type="text"
          class="form-control"
          placeholder="Buscar activo..."
        />
      </div>
      <button class="btn btn-outline-primary ms-2" @click="printBatchLabels">
        Imprimir Etiquetas
      </button>
    </div>

    <!-- Tabla de resultados para la pestaña activa -->
    <table class="table table-bordered table-hover">
      <thead class="table-light">
        <tr>
          <th @click="sortBy('activo.nombre')" style="cursor:pointer">
            Nombre <span v-if="sortKey === 'activo.nombre'">{{ sortOrderSymbol }}</span>
          </th>
          <th @click="sortBy('activo.codigoInterno')" style="cursor:pointer">
            Código Interno <span v-if="sortKey === 'activo.codigoInterno'">{{ sortOrderSymbol }}</span>
          </th>
          <th @click="sortBy('activo.descripcion')" style="cursor:pointer">
            Descripción <span v-if="sortKey === 'activo.descripcion'">{{ sortOrderSymbol }}</span>
          </th>
          <th @click="sortBy('activo.ubicacion.name')" style="cursor:pointer">
            Ubicación <span v-if="sortKey === 'activo.ubicacion.name'">{{ sortOrderSymbol }}</span>
          </th>
          <th @click="sortBy('activo.category.name')" style="cursor:pointer">
            Categoría <span v-if="sortKey === 'activo.category.name'">{{ sortOrderSymbol }}</span>
          </th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tag in displayedTags" :key="tag.id">
          <td>{{ tag.activo.nombre }}</td>
          <td>{{ tag.activo.codigoInterno || 'N/A' }}</td>
          <td>{{ tag.activo.descripcion }}</td>
          <td>{{ tag.activo.ubicacion?.name || '-' }}</td>
          <td>{{ tag.activo.category?.name || '-' }}</td>
          <td>
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
                    <label class="form-label">Código Interno</label>
                    <input v-model="editTagData.activo.codigoInterno" type="text" class="form-control"/>
                  </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="editTagData.activo.descripcion" class="form-control" required></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Ubicación Asignada</label>
                    <select v-model="editTagData.activo.ubicacion.id" class="form-select">
                      <option disabled value="">Seleccione una ubicación</option>
                      <option v-for="ubicacion in ubicaciones" :key="ubicacion.id" :value="ubicacion.id">
                        {{ ubicacion.name }}
                      </option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Categoría</label>
                    <select v-model="editTagData.activo.category.id" class="form-select">
                      <option disabled value="">Seleccione una categoría</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                  </div>
                  <div class="mb-3">
                        <label class="form-label">Estado</label>
                        <select v-model="editTagData.status" class="form-select">
                        <option value="Disponible">Disponible</option>
                        <option value="Prestado">Prestado</option>
                        <option value="Mantenimiento">Mantenimiento</option>
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
  import { db } from '../../firebase'
  import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp
    } from 'firebase/firestore'
  import MenuInventario from '../../components/MenuInventario.vue'
  import QRCode from 'qrcode'
  
  export default {
    name: 'PrestamoActivosAsignados',
    components: { MenuInventario },
    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      const tagsColPath = ['businesses', businessId, 'tagsMovil']
      const activeTab = ref('disponibles')
      const searchQuery = ref('')
      const tags = ref([])
      const bodegas = ref([]) // Nuevo ref para almacenar las bodegas
      const sortKey = ref("activo.nombre")
      const sortOrder = ref("asc")
      const sortOrderSymbol = computed(() => (sortOrder.value === 'asc' ? '↑' : '↓'))

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
      const ubicacionesCol = collection(db, 'businesses', businessId, "ubicaciones") // Renombrado de bodegasCol
      const categoriesCol = collection(db, 'businesses', businessId, "loanCategories") // Nueva colección para categorías
      const ubicaciones = ref([]) // Renombrado de bodegas
      const categories = ref([]) // Nuevo ref para categorías
      
      // Carga inicial de datos
      onMounted(() => {
        // Crea la query para ordenar por timestamp descendente por defecto
        //const q = query(collection(db, 'businesses', businessId, "tagsMovil"), orderBy("timestamp", "desc"))
        
        //onSnapshot(q, (snapshot) => {
        //  tags.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        //  console.log("Tags cargados:", tags.value)
        //})
        
        // Cargar las bodegas al montar el componente
        //fetchBodegas()
        fetchUbicaciones()
        fetchCategories()
      })

          // Carga inicial de la pestaña por defecto
    onMounted(() => loadTagsByStatus('Disponible'))
            function selectTab(tab) {
            if (activeTab.value === tab) return
            activeTab.value = tab
            searchQuery.value = ''
            const statusMap = {
                disponibles: 'Disponible',
                prestados: 'Prestado',
                mantenimiento: 'Mantenimiento'
            }
            loadTagsByStatus(statusMap[tab])
        }

        async function loadTagsByStatus(status) {
            console.log("Cargando tags por estado:", status)
            // Unsubscribe previous listener si existe
            if (tags.unsub) tags.unsub()
            const col = collection(db, ...tagsColPath)
            const q = query(col, where('status', '==', status), orderBy('timestamp', 'desc'))
            // Real-time
            const unsub = onSnapshot(q, snapshot => {
                tags.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            })
            tags.unsub = unsub
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

      const displayedTags = computed(() => {
      let arr = tags.value.filter(tag => {
        if (!searchQuery.value) return true
        const q = searchQuery.value.toLowerCase()
        return (
          tag.activo.nombre.toLowerCase().includes(q) ||
          tag.activo.descripcion?.toLowerCase().includes(q)
        )
      })
      // Ordenamiento
      const getValue = (obj, key) =>
        key.split('.').reduce((o, k) => (o ? o[k] : ''), obj)
      return arr.sort((a, b) => {
        const va = getValue(a, sortKey.value)
        const vb = getValue(b, sortKey.value)
        if (va < vb) return sortOrder.value === 'asc' ? -1 : 1
        if (va > vb) return sortOrder.value === 'asc' ? 1 : -1
        return 0
      })
    })
      
      const sortBy = (key) => {
        if (sortKey.value === key) {
          sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
        } else {
          sortKey.value = key
          sortOrder.value = 'asc'
        }
      }
            
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
      const deleteTag = async tag => {
        if (confirm('¿Eliminar este registro?')) {
            const docRef = doc(db, ...tagsColPath, tag.id)
            await deleteDoc(docRef)
        }
        }
  
      const editTag = (tag) => {
        // Creamos una copia profunda del tag para editar
        editTagData.value = JSON.parse(JSON.stringify(tag))
        showEditModal.value = true
      }
  
          // Función para actualizar el tag en Firestore
          async function updateTag() {
            console.log("Listo para Update", editTagData.value)
            const refDoc = doc(db, ...tagsColPath, editTagData.value.id)
            const selectedUb = ubicaciones.value.find(u=>u.id===editTagData.value.activo.ubicacion.id) || null
            const selectedCat = categories.value.find(c=>c.id===editTagData.value.activo.category.id) || null
            const data = {
                activo: {
                nombre: editTagData.value.activo.nombre,
                codigoInterno: editTagData.value.activo.codigoInterno,
                descripcion: editTagData.value.activo.descripcion,
                ubicacion: selectedUb,
                category: selectedCat,
                editedAt: serverTimestamp()
                },
                status: editTagData.value.status,
                editedAt: serverTimestamp()
            }
            await updateDoc(refDoc, data)
            showEditModal.value = false
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

      const printBatchLabels = async () => {
        const base = window.location.origin;
        let labelsHtml = '';
        for (const tag of displayedTags.value) {
            const tagId = tag.id;
            // Generar QR
            // eslint-disable-next-line no-await-in-loop
            const qrDataUrl = await QRCode.toDataURL(`${base}/inventario/verActivo?tag=${tagId}`, { margin: 1 });
            // Construir dos etiquetas por tag
            labelsHtml += `
            <div class="label">
                <img src="${qrDataUrl}" class="qr"/>
            </div>
            <div class="label">
                <div class="info">
                <div><strong>Tag:</strong> ${tagId}</div>
                <div><strong>Nombre:</strong> ${tag.activo.nombre}</div>
                <div><strong>Código:</strong> ${tag.activo.codigoInterno || ''}</div>
                <div><strong>Ubicación:</strong> ${tag.activo.ubicacion?.name || '-'}</div>
                <div><strong>Categoría:</strong> ${tag.activo.category?.name || '-'}</div>
                </div>
            </div>
            `;
        }
        // html wrapper
        const html = `
            <html>
            <head>
            <style>
                @media print {
                @page { size: 88mm 29.5mm; margin: 0; }
                html, body { margin:0; padding:0; width:88mm; height:100%; }
                .label { page-break-inside: avoid; display:inline-block; vertical-align:top; box-sizing:border-box; width:40mm; height:29.5mm; text-align:left; font-family:sans-serif; }
                .label + .label { margin-left:0mm; }
                }
                .qr { width:26mm; height:26mm; margin:0 0 0 6mm; }
                .info { margin:1.5mm; font-size:8pt; line-height:1.2; }
            </style>
            </head>
            <body>
            ${labelsHtml}
            </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
        };
      
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
        printEtiqueta,
        ubicaciones, // Renombrado
        categories,
        selectTab,
        activeTab,
        displayedTags,
        printBatchLabels
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
    .nav-tabs .nav-link { cursor: pointer; }
    th { cursor: pointer; }
    .mt-4 { margin-top: 1rem; }
  </style>
  