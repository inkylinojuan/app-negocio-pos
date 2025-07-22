<template>
  <div class="container mt-5">
    <h2>Administración Superadmin</h2>
    
    <!-- Pestañas de navegación -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a href="#" class="nav-link" :class="{ active: activeTab === 'businesses' }" @click.prevent="activeTab = 'businesses'">
          Negocios
        </a>
      </li>
      <li class="nav-item">
        <a href="#" class="nav-link" :class="{ active: activeTab === 'users' }" @click.prevent="activeTab = 'users'">
          Usuarios
        </a>
      </li>
      <li class="nav-item">
        <a 
          href="#" 
          class="nav-link" 
          :class="{ active: activeTab === 'owners' }" 
          @click.prevent="activeTab = 'owners'"
        >
          Propietarios
        </a>
      </li>
    </ul>
    
    <!-- TAB: NEGOCIOS -->
    <div v-if="activeTab === 'businesses'">
      <!-- Buscador -->
      <div class="mb-3">
        <input v-model="searchQuery" type="text" class="form-control" placeholder="Buscar negocio..." />
      </div>
      
      <!-- Tabla de negocios -->
      <table class="table table-striped">
        <thead>
          <tr>
            <th @click="sortBy('name')">
              Nombre <span v-if="sortKey==='name'">{{ sortOrderSymbol }}</span>
            </th>
            <th>
              ID 
            </th>
            <th @click="sortBy('description')">
              Descripción <span v-if="sortKey==='description'">{{ sortOrderSymbol }}</span>
            </th>
            <th @click="sortBy('address')">
              Dirección <span v-if="sortKey==='address'">{{ sortOrderSymbol }}</span>
            </th>
            <th @click="sortBy('nit')">
              NIT <span v-if="sortKey==='nit'">{{ sortOrderSymbol }}</span>
            </th>
            <th @click="sortBy('phone')">
              Teléfono <span v-if="sortKey==='phone'">{{ sortOrderSymbol }}</span>
            </th>
            <th @click="sortBy('email')">
              Email <span v-if="sortKey==='email'">{{ sortOrderSymbol }}</span>
            </th>
            <th @click="sortBy('createdAt')">
              Creado en <span v-if="sortKey==='createdAt'">{{ sortOrderSymbol }}</span>
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in filteredAndSortedBusinesses" :key="b.id">
            <td>{{ b.name }}</td>
            <td>{{ b.id }}</td>
            <td>{{ b.description }}</td>
            <td>{{ b.address }}</td>
            <td>{{ b.nit }}</td>
            <td>{{ b.phone }}</td>
            <td>{{ b.email }}</td>
            <td>{{ formatTimestamp(b.createdAt) }}</td>
            <td>
              <button class="btn btn-sm btn-warning me-1" @click="openEditModal(b)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="confirmDeletion(b)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Botón para crear nuevo negocio -->
      <button class="btn btn-primary" @click="openCreateModal">Crear Nuevo Negocio</button>
      
      <!-- Modal Editar Negocio -->
      <div v-if="showEditModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="updateBusiness">
              <div class="modal-header">
                <h5 class="modal-title">Editar Negocio</h5>
                <button type="button" class="btn-close" @click="closeEditModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre</label>
                  <input v-model="currentBusiness.name" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="currentBusiness.description" class="form-control" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Dirección</label>
                  <input v-model="currentBusiness.address" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">NIT</label>
                  <input v-model="currentBusiness.nit" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Teléfono</label>
                  <input v-model="currentBusiness.phone" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input v-model="currentBusiness.email" type="email" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Facturador</label>
                  <input v-model="currentBusiness.facturador" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Régimen Tributario</label>
                  <input v-model="currentBusiness.taxRegime" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Pie de Factura</label>
                  <textarea v-model="currentBusiness.invoiceFooter" class="form-control" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Facturador</label>
                  <input v-model="newBusiness.facturador" type="text" class="form-control" required />
                </div>
                <TipoInventarioSelector :key="businessKey" :business="currentBusiness" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Modal Crear Negocio -->
      <div v-if="showCreateModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="createBusiness">
              <div class="modal-header">
                <h5 class="modal-title">Crear Nuevo Negocio</h5>
                <button type="button" class="btn-close" @click="closeCreateModal"></button>
              </div>
              <div class="modal-body">
                <!-- Campos para crear negocio -->
                <div class="mb-3">
                  <label class="form-label">Nombre del Negocio</label>
                  <input v-model="newBusiness.name" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="newBusiness.description" class="form-control" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Dirección</label>
                  <input v-model="newBusiness.address" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">NIT</label>
                  <input v-model="newBusiness.nit" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Teléfono</label>
                  <input v-model="newBusiness.phone" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Correo Electrónico</label>
                  <input v-model="newBusiness.email" type="email" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Régimen Tributario</label>
                  <input v-model="newBusiness.taxRegime" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Pie de Factura</label>
                  <textarea v-model="newBusiness.invoiceFooter" class="form-control" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Facturador</label>
                  <input v-model="newBusiness.facturador" type="text" class="form-control" required />
                </div>
                <TipoInventarioSelector :key="createBusinessKey" v-if="newBusiness" :business="newBusiness" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeCreateModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Negocio</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Modal confirmación de eliminación (Negocios) -->
      <div v-if="showDeleteConfirmModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Eliminación</h5>
              <button type="button" class="btn-close" @click="closeDeleteModal"></button>
            </div>
            <div class="modal-body">
              <p>¿Está seguro de que desea eliminar este negocio y toda su base de datos?</p>
              <button class="btn btn-danger" @click="proceedToFinalDelete">Sí, eliminar</button>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeDeleteModal">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal verificación final para eliminación (Negocios) -->
      <div v-if="showFinalDeleteModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="finalDelete">
              <div class="modal-header">
                <h5 class="modal-title">Verificación Final</h5>
                <button type="button" class="btn-close" @click="closeFinalDeleteModal"></button>
              </div>
              <div class="modal-body">
                <p>Para confirmar, escriba el nombre del negocio: <strong>{{ businessToDelete.name }}</strong></p>
                <input v-model="deleteConfirmationName" type="text" class="form-control" placeholder="Escriba el nombre del negocio" required />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeFinalDeleteModal">Cancelar</button>
                <button type="submit" class="btn btn-danger">Confirmar Eliminación</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- TAB: USUARIOS -->
    <div v-if="activeTab === 'users'">
      <h3>Gestión de Usuarios</h3>
      
      <!-- Buscador -->
      <div class="mb-3">
        <input v-model="userSearchQuery" type="text" class="form-control" placeholder="Buscar usuario..." />
      </div>
      
      <!-- Tabla de usuarios -->
      <table class="table table-striped">
        <thead>
          <tr>
            <th @click="sortUsersBy('email')">
              Email <span v-if="userSortKey==='email'">{{ userSortOrderSymbol }}</span>
            </th>
            <th @click="sortUsersBy('role')">
              Rol <span v-if="userSortKey==='role'">{{ userSortOrderSymbol }}</span>
            </th>
            <th>Negocio</th>
            <th @click="sortUsersBy('createdAt')">
              Creado en <span v-if="userSortKey==='createdAt'">{{ userSortOrderSymbol }}</span>
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in enrichedUsers" :key="u.id">
            <td>{{ u.email }}</td>
            <td>{{ u.role }}</td>
            <td>{{ u.businessName }}</td>
            <td>{{ formatTimestampUser(u.createdAt) }}</td>
            <td>
              <button class="btn btn-sm btn-warning me-1" @click="openEditUserModal(u)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="confirmUserDeletion(u)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      
      <!-- Botón para crear usuario -->
      <button class="btn btn-primary" @click="openCreateUserModal">Crear Usuario</button>
      
      <!-- Modal Crear Usuario -->
      <div v-if="showCreateUserModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="createUser">
              <div class="modal-header">
                <h5 class="modal-title">Crear Usuario</h5>
                <button type="button" class="btn-close" @click="closeCreateUserModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input v-model="newUser.email" type="email" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Contraseña</label>
                  <input v-model="newUser.password" type="password" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Rol</label>
                  <select v-model="newUser.role" class="form-select" required>
                    <option value="">Seleccione rol</option>
                    <option value="admin">Admin</option>
                    <option value="operative">Operative</option>
                    <option value="Inventario">Inventario</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">ID del Negocio</label>
                  <input v-model="newUser.businessId" type="text" class="form-control" required />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeCreateUserModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Modal Editar Usuario -->
      <div v-if="showEditUserModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="updateUser">
              <div class="modal-header">
                <h5 class="modal-title">Editar Usuario</h5>
                <button type="button" class="btn-close" @click="closeEditUserModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input v-model="currentUser.email" type="email" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Rol</label>
                  <select v-model="currentUser.role" class="form-select" required>
                    <option value="">Seleccione rol</option>
                    <option value="admin">Admin</option>
                    <option value="operative">Operative</option>
                    <option value="Inventario">Inventario</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">ID del Negocio</label>
                  <input v-model="currentUser.businessId" type="text" class="form-control" required />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeEditUserModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Modal confirmación de eliminación (Usuarios) -->
      <div v-if="showUserDeleteConfirmModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Eliminación de Usuario</h5>
              <button type="button" class="btn-close" @click="closeUserDeleteModal"></button>
            </div>
            <div class="modal-body">
              <p>¿Está seguro de que desea eliminar este usuario?</p>
              <button class="btn btn-danger" @click="proceedToFinalUserDelete">Sí, eliminar</button>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeUserDeleteModal">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal verificación final para eliminación (Usuarios) -->
      <div v-if="showFinalUserDeleteModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="finalUserDelete">
              <div class="modal-header">
                <h5 class="modal-title">Verificación Final de Usuario</h5>
                <button type="button" class="btn-close" @click="closeFinalUserDeleteModal"></button>
              </div>
              <div class="modal-body">
                <p>Para confirmar, escriba el email del usuario: <strong>{{ userToDelete.email }}</strong></p>
                <input v-model="userDeleteConfirmation" type="text" class="form-control" placeholder="Escriba el email del usuario" required />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeFinalUserDeleteModal">Cancelar</button>
                <button type="submit" class="btn btn-danger">Confirmar Eliminación</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
    </div>

          <!-- Pestaña: Propietarios -->
          <div v-if="activeTab === 'owners'" class="tab-pane active show">
        <h4>Gestión de Propietarios</h4>
        <!-- Listado de Propietarios -->
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Propietario</th>
              <th>Email</th>
              <th>Negocios Asociados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="owner in owners" :key="owner.id">
              <td>{{ owner.name }}</td>
              <td>{{ owner.email }}</td>
              <td>
                <ul>
                  <li v-for="b in getBusinessesByOwner(owner.id)" :key="b.id">
                    {{ b.name }}
                    <button class="btn btn-sm btn-danger ms-1" @click="unassignBusiness(b.id)">
                      Desvincular
                    </button>
                  </li>
                </ul>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" @click="assignBusinessToOwner(owner.id)">
                  Agregar Negocio
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <hr>
        <!-- Formulario para Agregar/Editar Propietario -->
        <h5>{{ ownerEditMode ? 'Editar Propietario' : 'Agregar Nuevo Propietario' }}</h5>
        <form @submit.prevent="saveOwner">
          <div class="mb-3">
            <label class="form-label">Nombre</label>
            <input v-model="ownerForm.name" type="text" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="ownerForm.email" type="email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="ownerForm.password" type="password" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-success">
            {{ ownerEditMode ? 'Actualizar' : 'Agregar' }}
          </button>
          <button type="button" class="btn btn-secondary ms-2" v-if="ownerEditMode" @click="cancelOwnerEdit">
            Cancelar
          </button>
        </form>
      </div>
    
    <!-- Overlay de Loader -->
    <div v-if="isLoading" class="overlay">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
    
    <!-- Mensajes de estado -->
    <p class="mt-3" v-if="message">{{ message }}</p>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import TipoInventarioSelector from '../components/TipoInventarioSelector.vue'  


export default {
  name: 'ManageInstances',
  components: { TipoInventarioSelector }, // Agrégalo aquí
  setup() {
    // ---------------------------
    // Pestañas
    const activeTab = ref('businesses')
    
    // ---------------------------
    // Gestión de Negocios
    const businesses = ref([])
    const searchQuery = ref('')
    const sortKey = ref('createdAt')
    const sortOrder = ref('desc')
    const message = ref('')
    const isLoading = ref(false)

    const businessKey = ref('')      // Para el modal de edición
    const createBusinessKey = ref('')  // Para el modal de creación

    // Definimos las opciones disponibles
    const options = ["unicoConInventario", "unicoSinInventario", "variadoSinInventario"]
    // Valor seleccionado (por defecto, por ejemplo, el primero)
    const selectedOption = ref(options[0])
    
    // Variables y modales para negocios
    const showEditModal = ref(false)
    const showCreateModal = ref(false)
    const showDeleteConfirmModal = ref(false)
    const showFinalDeleteModal = ref(false)
    const currentBusiness = ref(null)
    const newBusiness = ref({
      name: '',
      description: '',
      address: '',
      nit: '',
      phone: '',
      email: '',
      taxRegime: '',
      invoiceFooter: '',
      facturador: '',
      deliveryAddress: '',
      deliveryPhone: '',
      createdAt: serverTimestamp(),
      turnoConfig: {
        tipo: 'unicoConInventario'
      }
    })
    const businessToDelete = ref(null)
    const deleteConfirmationName = ref('')
    const selectedUser = ref(null);

    const confirmDeleteUser = (user) => {
      selectedUser.value = user;
      // Mostrar modal de confirmación...
    };

    
    const fetchBusinesses = async () => {
      isLoading.value = true
      try {
        const businessesCol = collection(db, 'businesses')
        const snap = await getDocs(businessesCol)
        businesses.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        message.value = `Error al obtener negocios: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }
    
    const filteredAndSortedBusinesses = computed(() => {
      let filtered = businesses.value.filter(b => {
        const q = searchQuery.value.toLowerCase()
        return (
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.nit.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q)
        )
      })
      return filtered.sort((a, b) => {
        const modifier = sortOrder.value === 'asc' ? 1 : -1
        if (a[sortKey.value] < b[sortKey.value]) return -1 * modifier
        if (a[sortKey.value] > b[sortKey.value]) return 1 * modifier
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
    
    const sortOrderSymbol = computed(() => (sortOrder.value === 'asc' ? '↑' : '↓'))
    
    const openEditModal = (business) => {
      console.log('Editar negocio:', business)
      currentBusiness.value = { ...business }
      businessKey.value = business.id  // Asumiendo que business.id es único
      showEditModal.value = true
    }
    const closeEditModal = () => {
      showEditModal.value = false
      currentBusiness.value = null
    }
    
    const openCreateModal = () => {
      newBusiness.value = {
        name: '',
        description: '',
        address: '',
        nit: '',
        phone: '',
        email: '',
        taxRegime: '',
        invoiceFooter: '',
        facturador: '',
        deliveryAddress: '',
        deliveryPhone: '',
        createdAt: serverTimestamp(),
        turnoConfig: {
          tipo: 'unicoConInventario'
        }
      }
      createBusinessKey.value = 'new-' + Date.now() // Genera un valor único
      showCreateModal.value = true
    }
    const closeCreateModal = () => {
      showCreateModal.value = false
    }
    
    const updateBusiness = async () => {
      if (!currentBusiness.value || !currentBusiness.value.id) return
      try {
        isLoading.value = true
        const businessDoc = doc(db, 'businesses', currentBusiness.value.id)
        await updateDoc(businessDoc, { ...currentBusiness.value })
        message.value = 'Negocio actualizado correctamente.'
        await fetchBusinesses()
        closeEditModal()
      } catch (error) {
        message.value = `Error al actualizar negocio: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }
    
    const createBusiness = async () => {
      try {
        isLoading.value = true
        const businessesCol = collection(db, 'businesses')
        const docRef = await addDoc(businessesCol, newBusiness.value)
        message.value = `Negocio creado correctamente. ID: ${docRef.id}`
        await fetchBusinesses()
        closeCreateModal()
      } catch (error) {
        message.value = `Error al crear negocio: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }
    
    const confirmDeletion = (business) => {
      businessToDelete.value = business
      showDeleteConfirmModal.value = true
    }
    const closeDeleteModal = () => {
      showDeleteConfirmModal.value = false
      businessToDelete.value = null
    }
    const proceedToFinalDelete = () => {
      showDeleteConfirmModal.value = false
      showFinalDeleteModal.value = true
    }
    const closeFinalDeleteModal = () => {
      showFinalDeleteModal.value = false
      businessToDelete.value = null
      deleteConfirmationName.value = ''
    }
    const finalDelete = async () => {
      if (deleteConfirmationName.value !== businessToDelete.value.name) {
        message.value = 'El nombre ingresado no coincide. Eliminación cancelada.'
        return
      }
      try {
        isLoading.value = true
        const businessDoc = doc(db, 'businesses', businessToDelete.value.id)
        await deleteDoc(businessDoc)
        // Aquí podrías agregar la eliminación de colecciones asociadas al negocio
        message.value = 'Negocio eliminado correctamente.'
        await fetchBusinesses()
        closeFinalDeleteModal()
      } catch (error) {
        message.value = `Error al eliminar negocio: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }
    
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return ''
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    }
    
    // ---------------------------
    // Gestión de Usuarios (colección "users")
    const users = ref([])
    const userSearchQuery = ref('')
    const userSortKey = ref('createdAt')
    const userSortOrder = ref('desc')
    
    const fetchUsers = async () => {
      isLoading.value = true
      try {
        const usersCol = collection(db, 'users')
        const snap = await getDocs(usersCol)
        users.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        message.value = `Error al obtener usuarios: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }

    const enrichedUsers = computed(() => {
      return filteredAndSortedUsers.value.map(u => {
        const businessFound = businesses.value.find(b => b.id === u.businessId)
        return { ...u, businessName: businessFound ? businessFound.name : 'Sin negocio' }
      })
    })

    const filteredAndSortedUsers = computed(() => {
      const q = userSearchQuery.value.toLowerCase();
      let filtered = users.value.filter(u => {
        return (
          ((u.email || '').toLowerCase().includes(q)) ||
          ((u.role || '').toLowerCase().includes(q)) ||
          ((u.businessId || '').toLowerCase().includes(q))
        );
      });
      return filtered.sort((a, b) => {
        const modifier = userSortOrder.value === 'asc' ? 1 : -1;
        const aKey = ((a[userSortKey.value] || '') + '').toLowerCase();
        const bKey = ((b[userSortKey.value] || '') + '').toLowerCase();
        if (aKey < bKey) return -1 * modifier;
        if (aKey > bKey) return 1 * modifier;
        return 0;
      });
    });
    
    const sortUsersBy = (key) => {
      if (userSortKey.value === key) {
        userSortOrder.value = userSortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        userSortKey.value = key
        userSortOrder.value = 'asc'
      }
    }
    
    const userSortOrderSymbol = computed(() => (userSortOrder.value === 'asc' ? '↑' : '↓'))
    
    // Variables y modales para usuarios
    const showCreateUserModal = ref(false)
    const newUser = ref({
      email: '',
      password: '',
      role: '',
      businessId: '',
      createdAt: serverTimestamp()
    })
    const openCreateUserModal = () => {
      newUser.value = {
        email: '',
        password: '',
        role: '',
        businessId: '',
        createdAt: serverTimestamp()
      }
      showCreateUserModal.value = true
    }
    const closeCreateUserModal = () => {
      showCreateUserModal.value = false
    }
    
    const showEditUserModal = ref(false)
    const currentUser = ref(null)
    const openEditUserModal = (user) => {
      currentUser.value = { ...user }
      showEditUserModal.value = true
    }
    const closeEditUserModal = () => {
      showEditUserModal.value = false
      currentUser.value = null
    }
    
    const updateUser = async () => {
      if (!currentUser.value || !currentUser.value.id) return
      try {
        isLoading.value = true
        const userDoc = doc(db, 'users', currentUser.value.id)
        await updateDoc(userDoc, { ...currentUser.value })
        message.value = 'Usuario actualizado correctamente.'
        await fetchUsers()
        closeEditUserModal()
      } catch (error) {
        message.value = `Error al actualizar usuario: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }
    
    const showUserDeleteConfirmModal = ref(false)
    const showFinalUserDeleteModal = ref(false)
    const userToDelete = ref(null)
    const userDeleteConfirmation = ref('')
    
    const confirmUserDeletion = (user) => {
      userToDelete.value = user
      showUserDeleteConfirmModal.value = true
    }
    const closeUserDeleteModal = () => {
      showUserDeleteConfirmModal.value = false
      userToDelete.value = null
    }
    const proceedToFinalUserDelete = () => {
      showUserDeleteConfirmModal.value = false
      showFinalUserDeleteModal.value = true
    }
    const closeFinalUserDeleteModal = () => {
      showFinalUserDeleteModal.value = false
      userToDelete.value = null
      userDeleteConfirmation.value = ''
    }
    const finalUserDelete = async () => {
      if (userDeleteConfirmation.value !== userToDelete.value.email) {
        message.value = 'El email ingresado no coincide. Eliminación cancelada.'
        return
      }
      try {
        isLoading.value = true
        const userDoc = doc(db, 'users', userToDelete.value.id)
        await deleteDoc(userDoc)
        message.value = 'Usuario eliminado correctamente.'
        await fetchUsers()
        closeFinalUserDeleteModal()
      } catch (error) {
        message.value = `Error al eliminar usuario: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }
    
    const formatTimestampUser = (timestamp) => {
      if (!timestamp) return ''
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    }

        // Gestión de propietarios (owners)
        const owners = ref([])
    const fetchOwners = async () => {
      const col = collection(db, 'owners')
      const snap = await getDocs(col)
      owners.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    const ownerForm = ref({
      name: '',
      email: '',
      password: '',
    })
    const ownerEditMode = ref(false)
    const currentOwnerId = ref(null)

    const createUser = async () => {
      try {
        isLoading.value = true
        // Crea el usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.value.email, newUser.value.password)
        const uid = userCredential.user.uid
        // Guarda la información en Firestore
        await setDoc(doc(db, 'users', uid), {
          email: newUser.value.email,
          role: newUser.value.role,
          businessId: newUser.value.businessId,
          createdAt: serverTimestamp()
        })
        message.value = 'Usuario creado correctamente.'
        await fetchUsers()
        closeCreateUserModal()
      } catch (error) {
        message.value = `Error al crear usuario: ${error.message}`
      } finally {
        isLoading.value = false
      }
    }

    const saveOwner = async () => {
      if (ownerEditMode.value && currentOwnerId.value) {
        await updateDoc(doc(db, 'owners', currentOwnerId.value), { ...ownerForm.value })
      } else {
        try {
          // Crear el usuario en Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, ownerForm.value.email, ownerForm.value.password)
          const uid = userCredential.user.uid
          // Guardar la información adicional en Firestore
          const docRef = await setDoc(doc(db, 'users', uid), {
            fullName: ownerForm.value.name,
            email: ownerForm.value.email,
            role: 'owner',
            businessId: "zzz-zzzzz",
            createdAt: serverTimestamp()
          })
          message.value = 'Propietario registrado correctamente.'
          await setDoc(doc(db, 'owners', uid), { ...ownerForm.value })
          // Aquí podrías llamar a una Cloud Function para asignar custom claims si lo deseas
        } catch (error) {
          console.error('Error en el registro:', error)
          message.value = 'Error: ' + error.message
        }
      }
      ownerForm.value = { name: '', email: '' }
      ownerEditMode.value = false
      currentOwnerId.value = null
      await fetchOwners()
      alert('Propietario guardado')
    }

    const editOwner = (owner) => {
      ownerForm.value = { ...owner }
      ownerEditMode.value = true
      currentOwnerId.value = owner.id
    }

    const cancelOwnerEdit = () => {
      ownerForm.value = { name: '', email: '' }
      ownerEditMode.value = false
      currentOwnerId.value = null
    }

    // Función para obtener los negocios asociados a un propietario (filtrando por ownerId)
    const getBusinessesByOwner = (ownerId) => {
      console.log("owner Id", ownerId)
      return businesses.value.filter(b => b.ownerId === ownerId)
    }

    // Asignar un negocio a un propietario: se solicita el ID del negocio a vincular.
    const assignBusinessToOwner = async (ownerId) => {
      const businessId = prompt("Ingrese el ID del negocio a asignar:");
      if (businessId) {
        await updateDoc(doc(db, 'businesses', businessId), { ownerId: ownerId })
        await fetchBusinesses()
        alert("Negocio asignado al propietario")
      }
    }

    // Desvincular un negocio de un propietario
    const unassignBusiness = async (businessId) => {
      await updateDoc(doc(db, 'businesses', businessId), { ownerId: '' })
      await fetchBusinesses()
      alert("Negocio desvinculado")
    }
    
    onMounted(() => {
      fetchBusinesses()
      fetchUsers()
      fetchOwners()

    })
    
    return {
      businessKey,
      createBusinessKey,
      // Tabs
      activeTab,
      // Negocios
      businesses,
      searchQuery,
      filteredAndSortedBusinesses,
      sortKey,
      sortBy,
      sortOrder,
      sortOrderSymbol,
      openEditModal,
      closeEditModal,
      currentBusiness,
      updateBusiness,
      openCreateModal,
      closeCreateModal,
      newBusiness,
      createBusiness,
      message,
      isLoading,
      confirmDeletion,
      showDeleteConfirmModal,
      closeDeleteModal,
      proceedToFinalDelete,
      showFinalDeleteModal,
      closeFinalDeleteModal,
      deleteConfirmationName,
      finalDelete,
      formatTimestamp,
      // Usuarios
      users,
      userSearchQuery,
      filteredAndSortedUsers,
      sortUsersBy,
      userSortKey,
      userSortOrder,
      userSortOrderSymbol,
      showCreateUserModal,
      openCreateUserModal,
      closeCreateUserModal,
      newUser,
      createUser,
      showEditUserModal,
      currentUser,
      openEditUserModal,
      closeEditUserModal,
      updateUser,
      showUserDeleteConfirmModal,
      confirmUserDeletion,
      closeUserDeleteModal,
      proceedToFinalUserDelete,
      showFinalUserDeleteModal,
      closeFinalUserDeleteModal,
      userDeleteConfirmation,
      finalUserDelete,
      formatTimestampUser,
      showCreateModal,
      showEditModal,
      enrichedUsers,
      owners,
      ownerForm,
      ownerEditMode,
      currentOwnerId,
      saveOwner,
      editOwner,
      cancelOwnerEdit,
      getBusinessesByOwner,
      assignBusinessToOwner,
      unassignBusiness,
      fetchOwners,
      setActiveTab: (tab) => { activeTab.value = tab },
      userToDelete,
      options,
      selectedOption,
    }
  }
}
</script>

<style scoped>
th {
  cursor: pointer;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
