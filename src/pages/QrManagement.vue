<template>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex">
          <input v-model="searchTerm" class="form-control me-2" placeholder="Buscar..." />
          <input v-model.number="rangeStart" type="number" class="form-control me-1" placeholder="# Desde" />
          <input v-model.number="rangeEnd" type="number" class="form-control" placeholder="# Hasta" />
          <button class="btn btn-secondary ms-2" @click="clearRange">Limpiar Rango</button>
          <button class="btn btn-warning ms-2" @click="openAssign" :disabled="!pagedAndFiltered.length">Asignar</button>
            <button
                class="btn btn-danger ms-2"
                @click="unassignToRange"
                :disabled="!pagedAndFiltered.length"
            >
                Desasignar
            </button>
          <button class="btn btn-success ms-2" @click="exportQRCodes" :disabled="!pagedAndFiltered.length">
           Exportar QR
          </button>
          <button class="btn btn-info ms-2" @click="exportCsv" :disabled="!pagedAndFiltered.length">
            Exportar CSV
          </button>
        </div>
        <button class="btn btn-primary" @click="openCreate">Crear QR</button>
      </div>
  
      <table class="table table-hover">
        <thead>
          <tr>
            <th @click="sortBy('consecutive')" style="cursor: pointer"># <span v-if="sortKey==='consecutive'">{{ sortAsc ? '▲':'▼' }}</span></th>
            <th @click="sortBy('uid')" style="cursor: pointer">UID <span v-if="sortKey==='uid'">{{ sortAsc ? '▲':'▼' }}</span></th>
            <th @click="sortBy('businessName')" style="cursor: pointer">Negocio <span v-if="sortKey==='businessName'">{{ sortAsc ? '▲':'▼' }}</span></th>
            <th @click="sortBy('businessId')" style="cursor: pointer">businessId <span v-if="sortKey==='businessId'">{{ sortAsc ? '▲':'▼' }}</span></th>
            <th @click="sortBy('urlDestino')" style="cursor: pointer">URL Destino <span v-if="sortKey==='urlDestino'">{{ sortAsc ? '▲':'▼' }}</span></th>
            <th @click="sortBy('estadoQR')" style="cursor: pointer">Estado <span v-if="sortKey==='estadoQR'">{{ sortAsc ? '▲':'▼' }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedAndFiltered" :key="item.id">
            <td>{{ item.consecutive }}</td>
            <td>{{ item.uid }}</td>
            <td>{{ item.businessName || '-' }}</td>
            <td>{{ item.businessId || '-' }}</td>
            <td>{{ item.urlDestino || '-' }}</td>
            <td>{{ item.estadoQR }}</td>
          </tr>
        </tbody>
      </table>
  
      <!-- Crear QR Modal -->
      <div class="modal fade" tabindex="-1" :class="{'show d-block': showCreate}" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Crear QR</h5>
              <button type="button" class="btn-close" @click="closeCreate"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Número de UID a generar</label>
                <input v-model.number="createCount" type="number" class="form-control" />
              </div>
              <div class="mb-3">
                <label>Negocio (opcional)</label>
                <input v-model="businessSearch" type="text" class="form-control" placeholder="Buscar negocio..." />
                <ul class="list-group mt-1" style="max-height:150px; overflow:auto;">
                  <li v-for="b in filteredBusinesses" :key="b.id"
                      @click="selectBusiness(b)"
                      class="list-group-item list-group-item-action"
                      :class="{active: selectedBusiness && selectedBusiness.id===b.id}">
                    {{ b.name }}
                  </li>
                </ul>
              </div>
              <div class="mb-3">
                <label>URL Destino (opcional)</label>
                <input v-model="createUrlDestino" type="text" class="form-control" placeholder="https://..." />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeCreate">Cancelar</button>
              <button class="btn btn-primary" @click="createQRCodes">Crear</button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Assign Modal -->
      <div class="modal fade" tabindex="-1" :class="{'show d-block': showAssign}" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Asignar a Rango</h5>
              <button type="button" class="btn-close" @click="closeAssign"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Negocio</label>
                <input v-model="assignBusinessSearch" type="text" class="form-control" placeholder="Buscar negocio..." />
                <ul class="list-group mt-1" style="max-height:150px; overflow:auto;">
                  <li v-for="b in filteredBusinessesAssign" :key="b.id"
                      @click="selectAssignBusiness(b)"
                      class="list-group-item list-group-item-action"
                      :class="{active: assignBusiness && assignBusiness.id===b.id}">
                    {{ b.name }}
                  </li>
                </ul>
              </div>
              <div class="mb-3">
                <label>URL Destino</label>
                <input v-model="assignUrlDestino" type="text" class="form-control" placeholder="https://..." />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeAssign">Cancelar</button>
              <button class="btn btn-warning" @click="assignToRange">Asignar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore'
  import { db } from '../firebase'
  import QRCode from 'qrcode'
  import { jsPDF } from 'jspdf'
  
  
  const searchTerm = ref('')
  const rangeStart = ref(null)
  const rangeEnd = ref(null)
  
  const dataList = ref([])
  const businesses = ref([])
  
  const sortKey = ref('consecutive')
  const sortAsc = ref(true)
  
  // Modals control
  const showCreate = ref(false)
  const showAssign = ref(false)
  
  // Create QR
  const createCount = ref(1)
  const businessSearch = ref('')
  const createUrlDestino = ref('')
  const selectedBusiness = ref(null)
  
  // Assign
  const assignBusinessSearch = ref('')
  const assignUrlDestino = ref('')
  const assignBusiness = ref(null)
  
  // Load data
  const fetchData = async () => {
    const snap = await getDocs(collection(db, 'CodigosQR'))
    dataList.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    sortData()
  }
  const fetchBusinesses = async () => {
    const snap = await getDocs(collection(db, 'businesses'))
    businesses.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
  
  onMounted(async () => {
    await fetchData()
    await fetchBusinesses()
  })
  
  // Filtering
  const filteredBySearch = computed(() => {
    const term = searchTerm.value.toLowerCase()
    return dataList.value.filter(item =>
      ['consecutive','uid','businessName','businessId','urlDestino','estadoQR']
        .some(k => String(item[k]||'').toLowerCase().includes(term))
    )
  })
  const filteredByRange = computed(() => {
    if (rangeStart.value==null && rangeEnd.value==null) return filteredBySearch.value
    return filteredBySearch.value.filter(i => {
      const c=i.consecutive
      if (rangeStart.value!=null&&c<rangeStart.value) return false
      if (rangeEnd.value!=null&&c>rangeEnd.value) return false
      return true
    })
  })
  const pagedAndFiltered = filteredByRange
  
  // Sorting
  const sortData = () => {
    dataList.value.sort((a,b) => {
      const av=a[sortKey.value], bv=b[sortKey.value]
      if(av==bv) return 0
      return sortAsc.value ? (av>bv?1:-1) : (av<bv?1:-1)
    })
  }
  const sortBy = k => {
    if(sortKey.value===k) sortAsc.value=!sortAsc.value
    else { sortKey.value=k; sortAsc.value=true }
    sortData()
  }
  
  const clearRange = () => { rangeStart.value=null; rangeEnd.value=null }
  
  // Create QR handlers
  const openCreate = () => showCreate.value=true
  const closeCreate = () => { showCreate.value=false; selectedBusiness.value=null; createUrlDestino.value='' }
  const filteredBusinesses = computed(() => businesses.value.filter(b=>b.name.toLowerCase().includes(businessSearch.value.toLowerCase())))
  const selectBusiness = b=>selectedBusiness.value=b
  const createQRCodes = async () => {
    if(createCount.value<1) return alert('Cantidad inválida')
    let maxC = dataList.value.reduce((m,i)=>Math.max(m,i.consecutive),0)
    for(let i=1;i<=createCount.value;i++){
      const newConsec = maxC + i
      const uid = crypto.randomUUID()
      // use uid as doc id
      await setDoc(doc(db,'CodigosQR',uid),{
        id: uid,
        consecutive: newConsec,
        uid,
        businessId: selectedBusiness.value?.id||'',
        businessName: selectedBusiness.value?.name||'',
        urlDestino: createUrlDestino.value||'',
        estadoQR: 'NoAsignado'
      })
    }
    await fetchData()
    closeCreate()
  }
  
  // Assign handlers
  const openAssign = () => showAssign.value=true
  const closeAssign = () => { showAssign.value=false; assignBusiness.value=null; assignUrlDestino.value='' }
  const filteredBusinessesAssign = computed(() => businesses.value.filter(b=>b.name.toLowerCase().includes(assignBusinessSearch.value.toLowerCase())))
  const selectAssignBusiness = b=>assignBusiness.value=b
  const assignToRange = async () => {
    const items = pagedAndFiltered.value
    if(!items.length) return alert('No hay documentos a asignar')
    for(const item of items) {
      await updateDoc(doc(db,'CodigosQR',item.id),{
        businessId: assignBusiness.value?.id||'',
        businessName: assignBusiness.value?.name||'',
        urlDestino: assignUrlDestino.value||''
      })
    }
    await fetchData()
    closeAssign()
  }

  const exportQRCodes = async () => {
    const items = pagedAndFiltered.value
    if (!items.length) return

    // 1) Inicializa jsPDF en mm
    const doc = new jsPDF({
        unit: 'mm',
        format: 'letter',      // 215.9 × 279.4 mm
        orientation: 'portrait'
    })

    const pageWidth  = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // 2) Parámetros de layout
    const margin    = 10    // mm
    const qrSize    = 28    // mm QR 18×18
    const textGap   = 2     // mm entre QR y texto
    const fontSize  = 10     // mm de alto para el número
    doc.setFontSize(fontSize)

    // 3) Calcula cuántos entran por fila/columna
    const perRow = Math.floor((pageWidth  - 2*margin) / qrSize)
    const perCol = Math.floor((pageHeight - 2*margin) / (qrSize + textGap + fontSize))
    const perPage = perRow * perCol

    // 4) Itera y dibuja
    for (let idx = 0; idx < items.length; idx++) {
        // nueva página salvo la primera
        if (idx > 0 && idx % perPage === 0) {
        doc.addPage()
        }

        const pageIndex    = Math.floor(idx / perPage)
        const indexInPage  = idx % perPage
        const col          = indexInPage % perRow
        const row          = Math.floor(indexInPage / perRow)

        const x = margin + col * qrSize
        const y = margin + row * (qrSize + textGap + fontSize)

        // URL a codificar
        const url = `https://qr2.evtica.com/QR?uid=${items[idx].uid}`

        // Genera un dataURL de alta resolución (200px) y lo escala a 18 mm
        const dataUrl = await QRCode.toDataURL(url, { width: 200 })

        // 5) Inserta el QR
        doc.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize)

        // 6) Inserta el consecutivo 2 mm debajo, centrado
        const txt   = String(items[idx].consecutive)
        const tW    = doc.getTextWidth(txt)
        const tX    = x + qrSize/2 - tW/2
        const tY    = y + qrSize + textGap
        doc.text(txt, tX, tY)
    }

    // 7) Descarga
    doc.save('QRCodes.pdf')
    }

    /**
 * Exporta a CSV los campos de cada ítem filtrado:
 * #consecutive, uid, businessId, businessName, urlDestino, estadoQR
 */
    const exportCsv = () => {
    const items = pagedAndFiltered.value
    if (!items.length) {
        alert('No hay datos para exportar.')
        return
    }

    // 1) Cabecera
    const header = [
        '#consecutive',
        'uid',
        'businessId',
        'businessName',
        'urlDestino',
        'estadoQR'
    ]
    // 2) Filas
    const rows = items.map(item => [
        item.consecutive,
        item.uid,
        item.businessId || '',
        item.businessName || '',
        item.urlDestino || '',
        item.estadoQR
    ])

    // 3) Construir CSV
    const csvContent =
        [header, ...rows]
        .map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\r\n')

    // 4) Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'CodigosQR.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    }

    const unassignToRange = async () => {
        const items = pagedAndFiltered.value
        if (!items.length) {
            return alert('No hay códigos para desasignar.')
        }
        // Confirmación
        if (!confirm('¿Estás seguro de desasignar estos QR?')) {
            return
        }
        // Actualizar cada documento
        for (const item of items) {
            await updateDoc(doc(db, 'CodigosQR', item.id), {
            businessId: '',
            businessName: '',
            urlDestino: '',
            estadoQR: 'NoAsignado',
            UsuarioVinculado: false,
            securityAnswer: '',
            securityQuestion: '',
            })
        }
        // Refrescar la lista
        await fetchData()
        }

  </script>
  
  <style scoped>
  .modal.show.d-block { overflow-y: auto; }
  </style>
  