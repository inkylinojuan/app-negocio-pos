<template>
  <div class="container mt-5">
    <h2>Registrar Gasto</h2>
    
    <!-- Pestañas para diferentes modos -->
    <ul class="nav nav-tabs mb-4" >
      <div class="btn-group mb-4" role="group">
      <button 
        @click="activeTab = 'registro'"
        :class="['btn', activeTab === 'registro' ? 'btn-primary' : 'btn-outline-primary']"
      >
        Registro
      </button>
      <button 
        @click="activeTab = 'gastos'"
        :class="['btn', activeTab === 'gastos' ? 'btn-primary' : 'btn-outline-primary']"
      >
        Tipos de Gastos
      </button>
      <button 
        @click="activeTab = 'categorias'"
        :class="['btn', activeTab === 'categorias' ? 'btn-primary' : 'btn-outline-primary']"
      >
        Categorías
      </button>
    </div>
    </ul>


    <!-- Modo gasto abierto -->
    <div>
      <!-- Pestaña de Registro -->
      <div v-if="activeTab === 'registro'" class="tab-pane fade show active">
        <form @submit.prevent="addOpenExpense" class="row g-3">
          <!-- Primera fila de 3 columnas -->
          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Gasto</label>
              <select v-model="newOpenExpense.expenseId" class="form-select" required>
                <option value="">Seleccione un gasto</option>
                <option v-for="exp in expenseTypes" :key="exp.id" :value="exp.id">
                  {{ exp.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Categoría de Gasto</label>
              <select v-model="newOpenExpense.categoryId" class="form-select" required>
                <option value="">Seleccione una categoría</option>
                <option v-for="cat in expenseCategories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Valor ($)</label>
              <input
                v-model="newOpenExpense.total"
                type="text"
                class="form-control"
                placeholder="5.000"
                @input="formatCurrency"
                required
              />
            </div>
          </div>

          <!-- Segunda fila de 3 columnas -->
          <div class="row mt-3">
            <div class="col-md-4">
              <label class="form-label">Descripción</label>
              <input
                v-model="newOpenExpense.description"
                type="text"
                class="form-control"
                placeholder="Descripción del gasto"
                required
              />
            </div>
            <div class="col-md-4">
              <label class="form-label">Pagado a</label>
              <select v-model="newOpenExpense.paidTo" class="form-select" required>
                <option value="">Seleccione un contacto</option>
                <option v-for="contact in contacts" :key="contact.id" :value="contact">
                  {{ contact.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Código en carpeta</label>
              <input
                v-model.number="newOpenExpense.folderCode"
                type="number"
                class="form-control"
                placeholder="Código"
                required
              />
            </div>
          </div>

          <!-- Tercera fila -->
          <div class="row mt-3">
            <div class="row mt-3">
              <div class="col-md-4">
                <label class="form-label">Fecha del gasto</label>
                <input
                  v-model="newOpenExpense.expenseDate"
                  type="datetime-local"
                  class="form-control"
                  required
                />
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Anexo</label>
              <input
                type="file"
                ref="fileInput"
                class="form-control"
                @change="handleFileUpload"
              />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-12">
              <button type="submit" class="btn btn-primary">Agregar Gasto</button>
            </div>
          </div>
        </form>

        <!-- Tabla de gastos registrados -->
        <h3 class="mt-4">Gastos Registrados en el Turno</h3>
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead class="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Gasto</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Pagado a</th>
                <th>Código</th>
                <th>Valor</th>
                <th>Anexo</th> <!-- Nueva columna -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in openExpenses" :key="expense.id">
                <td>{{ formatDisplayDate(expense.createdAt) }}</td>
                <td>{{ getExpenseName(expense.expenseId) }}</td>
                <td>{{ getCategoryName(expense.categoryId) }}</td>
                <td>{{ expense.description }}</td>
                <td>{{ expense.paidTo?.name }}</td>
                <td>{{ expense.folderCode }}</td>
                <td>${{ formatNumber(expense.total) }}</td>
                <td>
                  <!--<button 
                    v-if="expense.attachmentUrl"
                    @click="downloadAttachment(expense.attachmentUrl, expense.description)"
                    class="btn btn-sm btn-info"
                    title="Descargar anexo"
                  >
                    <i class="bi bi-download"></i> Anexo
                  </button>-->
                  <button 
                    v-if="expense.attachmentPath || expense.attachmentUrl"
                    @click="openAttachmentInNewWindow(expense.attachmentPath || expense.attachmentUrl, expense.description)"
                    class="btn btn-sm btn-info"
                    title="Ver anexo"
                  >
                    <i class="bi bi-eye"></i> Anexo
                  </button>
                  <span v-else class="text-muted">Sin anexo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'gastos'">
      <ExpenseTypesCRUD />
    </div>

    <div v-if="activeTab === 'categorias'">
      <ExpenseCategoriesCRUD />
    </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { db, storage } from '../firebase'
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  doc,
  getDoc
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useRoute } from 'vue-router'
import ExpenseTypesCRUD from '../components/ExpenseTypesCRUD.vue'
import ExpenseCategoriesCRUD from '../components/ExpenseCategoriesCRUD.vue'

export default {
  name: 'ExpensesOpen',
  components: {
    ExpenseTypesCRUD,
    ExpenseCategoriesCRUD
  },
  setup() {
    const route = useRoute()
    const businessId = localStorage.getItem('businessId') || ''
    const turnId = route.params.turnId || 'currentTurnId'
    const fileInput = ref(null)
    const activeTab = ref('registro')

    // Configuración del negocio
    const businessConfig = ref({})
    const isGastoAbierto = computed(() => {
      return businessConfig.value.turnoConfig?.tipoGasto === 'gastoAbierto'
    })

    // Datos para el modo gasto abierto
    const newOpenExpense = ref({
      expenseId: '',
      categoryId: '',
      total: '',
      description: '',
      paidTo: null,
      folderCode: '',
      expenseDate: new Date().toISOString().split('T')[0],
      attachmentUrl: '',
      expenseDate: '',
      expenseDateTime: ''
    })

    const openExpenses = ref([])
    const expenseTypes = ref([])
    const expenseCategories = ref([])
    const contacts = ref([])

    // Cargar configuración del negocio
    const fetchBusinessConfig = async () => {
      const docRef = doc(db, 'businesses', businessId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        businessConfig.value = docSnap.data()
      }
    }

    const downloadAttachment = async (fileUrlOrPath, fileName) => {
      try {
        // Si es una ruta de Storage (preferido)
        if (fileUrlOrPath.startsWith('businesses/')) {
          const storage = getStorage();
          const fileRef = ref(storage, fileUrlOrPath);
          const url = await getDownloadURL(fileRef);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || fileUrlOrPath.split('/').pop();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } 
        // Si es una URL completa (backward compatibility)
        else {
          const token = fileUrlOrPath.includes('token=') 
            ? fileUrlOrPath.split('token=')[1] 
            : '';
          
          const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/app-negocio-pos.firebasestorage.app/o/';
          const pathPart = fileUrlOrPath.split('/o/')[1];
          const encodedPath = encodeURIComponent(decodeURIComponent(pathPart.split('?')[0]));
          
          const downloadUrl = `${baseUrl}${encodedPath}?alt=media${token ? `&token=${token}` : ''}`;
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName || encodedPath.split('/').pop();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Download error:', error);
        window.open(fileUrlOrPath, '_blank');
        alert('No se pudo descargar. Se abrió en nueva pestaña.');
      }
    }

    const openAttachmentInNewWindow = async (fileUrlOrPath, fileName) => {
      try {
        let finalUrl = '';
        
        // Si es una ruta de Firebase Storage (recomendado)
        if (fileUrlOrPath.startsWith('businesses/')) {
          const storage = getStorage();
          const fileRef = ref(storage, fileUrlOrPath);
          finalUrl = await getDownloadURL(fileRef);
        } 
        // Si ya es una URL completa
        else {
          // Corregir la URL si es necesario
          if (fileUrlOrPath.includes('appspot.com')) {
            finalUrl = fileUrlOrPath.replace('appspot.com', 'firebasestorage.app');
          } else {
            finalUrl = fileUrlOrPath;
          }
        }
        
        // Abrir en nueva ventana/pestaña
        const newWindow = window.open(finalUrl, '_blank');
        
        // Verificar si el navegador bloqueó la ventana emergente
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          throw new Error('El navegador bloqueó la ventana emergente. Por favor habilite popups para este sitio.');
        }
        
      } catch (error) {
        console.error('Error al abrir anexo:', error);
        
        // Fallback: descarga directa
        const link = document.createElement('a');
        link.href = fileUrlOrPath.startsWith('businesses/') 
          ? await getDownloadURL(ref(getStorage(), fileUrlOrPath))
          : fileUrlOrPath;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(error.message || 'No se pudo abrir el documento. Se ha abierto en la misma pestaña.');
      }
    }

    // Convertir datetime-local a formato ISO
      const setExpenseDate = () => {
        if (newOpenExpense.value.expenseDateTime) {
          newOpenExpense.value.expenseDate = new Date(newOpenExpense.value.expenseDateTime).toISOString()
        }
      }

    // Función mejorada para formatear fechas
    const formatCreatedAt = (date) => {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
      }

      // Ajustar a UTC-5 (hora de Colombia)
      const adjustedDate = new Date(date);
      adjustedDate.setHours(adjustedDate.getHours() - 5);
      
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      };
      
      let formatted = adjustedDate.toLocaleString('es-CO', options);
      formatted = formatted.replace('a. m.', 'a.m.').replace('p. m.', 'p.m.');
      
      return `${formatted} UTC-5`;
    }

    // Cargar datos necesarios
    const fetchData = async () => {
      // Cargar tipos de gasto
      const expenseTypesCol = collection(db, 'businesses', businessId, 'expenseTypes')
      const expenseTypesSnap = await getDocs(expenseTypesCol)
      expenseTypes.value = expenseTypesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log("expesesType", expenseTypes.value)

      // Cargar categorías
      const categoriesCol = collection(db, 'businesses', businessId, 'expenseCategories')
      const categoriesSnap = await getDocs(categoriesCol)
      expenseCategories.value = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Cargar contactos
      const contactsCol = collection(db, 'businesses', businessId, 'contacts')
      const contactsSnap = await getDocs(contactsCol)
      contacts.value = contactsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Cargar gastos del turno
      const expensesCol = collection(db, 'businesses', businessId, 'expenses')
      const q = query(expensesCol, where('turnId', '==', turnId))
      const expensesSnap = await getDocs(q)
      openExpenses.value = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    const formatDisplayDate = (dateInput) => {
      try {
        // Caso 1: Si es null/undefined
        if (!dateInput) return '';
        
        // Caso 2: Si es un Timestamp de Firestore (tiene propiedad seconds)
        if (typeof dateInput === 'object' && 'seconds' in dateInput) {
          const date = new Date(dateInput.seconds * 1000);
          return formatCreatedAt(date);
        }
        
        // Caso 3: Si ya es un string con formato UTC
        if (typeof dateInput === 'string' && dateInput.includes('UTC')) {
          return dateInput;
        }
        
        // Caso 4: Si es un string de fecha ISO
        if (typeof dateInput === 'string') {
          const date = new Date(dateInput);
          if (!isNaN(date.getTime())) {
            return formatCreatedAt(date);
          }
        }
        
        // Caso 5: Si es un objeto Date
        if (dateInput instanceof Date) {
          return formatCreatedAt(dateInput);
        }
        
        // Si no coincide con ningún caso
        console.warn('Formato de fecha no reconocido:', dateInput);
        return '';
      } catch (error) {
        console.error('Error al formatear fecha:', error, 'Input:', dateInput);
        return '';
      }
    }

    // Formatear valor monetario
    const formatCurrency = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      value = Number(value).toLocaleString('es-CO')
      newOpenExpense.value.value = value
    }

    // Formatear número para visualización
    const formatNumber = (num) => {
      return Number(num).toLocaleString('es-CO')
    }

    // Manejar subida de archivo
    const handleFileUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      try {
        const fileRef = storageRef(storage, `businesses/${businessId}/expenses/${file.name}`)
        await uploadBytes(fileRef, file)
        const url = await getDownloadURL(fileRef)
        newOpenExpense.value.attachmentUrl = url
      } catch (error) {
        console.error("Error al subir archivo:", error)
        alert("Error al subir el archivo")
      }
    }

    // Agregar nuevo gasto (modo abierto)
    const addOpenExpense = async () => {
      try {
        // Crear objeto con la fecha formateada
        const expenseData = {
          turnId,
          expenseId: newOpenExpense.value.expenseId,
          categoryId: newOpenExpense.value.categoryId,
          total: Number(newOpenExpense.value.value.replace(/\D/g, '')),
          description: newOpenExpense.value.description,
          paidTo: newOpenExpense.value.paidTo ? {
            name: newOpenExpense.value.paidTo.name,
            document: newOpenExpense.value.paidTo.document,
            address: newOpenExpense.value.paidTo.address,
            email: newOpenExpense.value.paidTo.email,
            phone: newOpenExpense.value.paidTo.phone
          } : null,
          folderCode: newOpenExpense.value.folderCode,
          expenseDate: new Date(newOpenExpense.value.expenseDate),
          createdAt: new Date(newOpenExpense.value.expenseDate), // O usa new Date().toISOString() si prefieres
          attachmentUrl: newOpenExpense.value.attachmentUrl
        };

        await addDoc(collection(db, 'businesses', businessId, 'expenses'), expenseData);

        // Limpiar formulario
        newOpenExpense.value = {
          expenseId: '',
          categoryId: '',
          total: '',
          description: '',
          paidTo: null,
          folderCode: '',
          expenseDate: new Date().toISOString().split('T')[0],
          attachmentUrl: ''
        }
        if (fileInput.value) fileInput.value.value = ''

        // Recargar gastos
        await fetchData()
      } catch (error) {
        console.error("Error al agregar gasto:", error)
        alert("Error al registrar el gasto")
      }
    }

    // Helper para obtener nombre de gasto
    const getExpenseName = (id) => {
      const expense = expenseTypes.value.find(e => e.id === id)
      return expense ? expense.name : 'Desconocido'
    }

    // Helper para obtener nombre de categoría
    const getCategoryName = (id) => {
      const category = expenseCategories.value.find(c => c.id === id)
      return category ? category.name : 'Desconocido'
    }

    // Formatear fecha
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-CO')
    }

    onMounted(async () => {
      await fetchBusinessConfig()
      if (isGastoAbierto.value) {
        await fetchData()
      }
    })

    return {
      isGastoAbierto,
      activeTab,
      newOpenExpense,
      openExpenses,
      expenseTypes,
      expenseCategories,
      contacts,
      fileInput,
      formatCurrency,
      formatNumber,
      handleFileUpload,
      addOpenExpense,
      getExpenseName,
      getCategoryName,
      formatDate,
      formatDisplayDate,
      setExpenseDate,
      downloadAttachment,
      openAttachmentInNewWindow
    }
  }
}
</script>

<style scoped>
.tab-content {
  padding: 20px 0;
}
.table-responsive {
  overflow-x: auto;
}
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.bi {
  margin-right: 0.25rem;
}

.text-muted {
  color: #6c757d;
  font-style: italic;
  font-size: 0.875rem;
}
</style>