<template>
  <div class="container mt-4">
    <h2>Gestión de Contactos y Roles</h2>
    <!-- Pestañas de navegación controladas por activeTab -->
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          href="#"
          class="nav-link"
          :class="{ active: activeTab === 'contacts' }"
          @click.prevent="setActiveTab('contacts')"
        >
          Listado de Contactos
        </a>
      </li>
      <li class="nav-item">
        <a
          href="#"
          class="nav-link"
          :class="{ active: activeTab === 'newContact' }"
          @click.prevent="setNewContactTab"
        >
          Nuevo Contacto
        </a>
      </li>
      <li class="nav-item">
        <a
          href="#"
          class="nav-link"
          :class="{ active: activeTab === 'roles' }"
          @click.prevent="setActiveTab('roles')"
        >
          Roles
        </a>
      </li>
    </ul>

    <!-- Contenido de las pestañas -->
    <div class="tab-content mt-3">
      <!-- Pestaña 1: Listado de Contactos -->
      <div v-if="activeTab === 'contacts'" class="tab-pane" :class="{'active show d-block': activeTab === 'contacts'}">
        <div class="mb-3">
          <label for="roleFilter" class="form-label">Filtrar por rol:</label>
          <select id="roleFilter" class="form-select" v-model="selectedRole" @change="fetchContactsData">
            <option value="">Todos</option>
            <option value="cliente">Cliente</option>
            <option value="proveedor">Proveedor</option>
            <option value="empleado">Empleado</option>
            <option value="mensajero">Mensajero</option>
          </select>
        </div>
        <div v-if="contacts.length === 0" class="alert alert-info">
          No se encontraron contactos.
        </div>
        <table v-else class="table table-striped">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Documento</th>
              <th>Roles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contact in contacts" :key="contact.id">
              <td>{{ contact.name }}</td>
              <td>{{ contact.email }}</td>
              <td>{{ contact.phone }}</td>
              <td>{{ contact.address }}</td>
              <td>{{ contact.document }}</td>
              <td>{{ contact.roles.join(', ') }}</td>
              <td>
                <button class="btn btn-sm btn-primary me-1" @click="editContact(contact)">
                  Editar
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteContactById(contact.id)">
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pestaña 2: Nuevo Contacto / Editar Contacto -->
      <div v-if="activeTab === 'newContact'" class="tab-pane" :class="{'active show d-block': activeTab === 'newContact'}">
        <div class="mt-3">
          <h4>{{ editMode ? 'Editar Contacto' : 'Agregar Nuevo Contacto' }}</h4>
          <form @submit.prevent="saveContact">
            <div class="mb-3">
              <label for="contactName" class="form-label">Nombre</label>
              <input type="text" id="contactName" class="form-control" v-model="contactForm.name" required />
            </div>
            <div class="mb-3">
              <label for="contactEmail" class="form-label">Correo</label>
              <input type="email" id="contactEmail" class="form-control" v-model="contactForm.email" />
            </div>
            <div class="mb-3">
              <label for="contactPhone" class="form-label">Teléfono</label>
              <input type="text" id="contactPhone" class="form-control" v-model="contactForm.phone" />
            </div>
            <div class="mb-3">
              <label for="contactAddress" class="form-label">Dirección</label>
              <input type="text" id="contactAddress" class="form-control" v-model="contactForm.address" placeholder="Ingrese la dirección" />
            </div>
            <div class="mb-3">
              <label for="contactDocument" class="form-label">Documento de Identidad</label>
              <input type="text" id="contactDocument" class="form-control" v-model="contactForm.document" placeholder="Ingrese el número de documento" />
            </div>
            <div class="mb-3">
              <label for="contactRoles" class="form-label">Roles (separados por coma):</label>
              <input type="text" v-model="rolesInput" placeholder="cliente, proveedor, etc." class="form-control" />
            </div>
            <button type="submit" class="btn btn-success">
              {{ editMode ? 'Actualizar' : 'Agregar' }}
            </button>
            <button type="button" class="btn btn-secondary ms-2" v-if="editMode" @click="cancelEdit">
              Cancelar
            </button>
          </form>
        </div>
      </div>

      <!-- Pestaña 3: Gestión de Roles -->
      <div v-if="activeTab === 'roles'" class="tab-pane" :class="{'active show d-block': activeTab === 'roles'}">
        <div class="mt-3">
          <h4>Gestión de Roles</h4>
          <div v-if="availableRoles.length === 0" class="alert alert-info">
            No se encontraron roles.
          </div>
          <table v-else class="table table-bordered">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in availableRoles" :key="role.id">
                <td>{{ role.name }}</td>
                <td>
                  <button class="btn btn-sm btn-primary me-1" @click="editRole(role)">
                    Editar
                  </button>
                  <button class="btn btn-sm btn-danger" @click="deleteRole(role.id)">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <hr />
          <h5>{{ roleEditMode ? 'Editar Rol' : 'Agregar Nuevo Rol' }}</h5>
          <form @submit.prevent="saveRole">
            <div class="mb-3">
              <label for="roleName" class="form-label">Nombre del Rol</label>
              <input type="text" id="roleName" class="form-control" v-model="roleForm.name" required />
            </div>
            <button type="submit" class="btn btn-success">
              {{ roleEditMode ? 'Actualizar' : 'Agregar' }}
            </button>
            <button type="button" class="btn btn-secondary ms-2" v-if="roleEditMode" @click="cancelRoleEdit">
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../firebase'

export default {
  name: 'ContactsManager',
  setup() {
    const businessId = localStorage.getItem('businessId') || ''

    // Control de pestañas
    const activeTab = ref('contacts')
    const setActiveTab = (tab) => {
      activeTab.value = tab
      console.log('activeTab:', activeTab.value)
    }

    // Datos para contactos
    const contacts = ref([])
    const selectedRole = ref('')
    const editMode = ref(false)
    const currentEditingId = ref(null)
    // Se agregan los nuevos campos: address y document
    const contactForm = ref({
      name: '',
      email: '',
      phone: '',
      address: '',
      document: '',
      roles: []
    })
    const rolesInput = ref('')

    // Datos para roles
    const availableRoles = ref([])
    const roleEditMode = ref(false)
    const currentRoleEditingId = ref(null)
    const roleForm = ref({
      name: ''
    })

    // Referencias a las colecciones
    const contactsCol = collection(db, 'businesses', businessId, 'contacts')
    const rolesCol = collection(db, 'businesses', businessId, 'roles')

    // Función para obtener contactos (filtrados por rol si se selecciona)
    const fetchContactsData = async () => {
      let q
      if (selectedRole.value) {
        q = query(contactsCol, where('roles', 'array-contains', selectedRole.value))
      } else {
        q = query(contactsCol)
      }
      const snap = await getDocs(q)
      contacts.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('Contacts:', contacts.value)
    }

    // Función para obtener roles desde Firestore
    const fetchRoles = async () => {
      const snap = await getDocs(rolesCol)
      availableRoles.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('Available Roles:', availableRoles.value)
    }

    // Guardar (agregar o actualizar) contacto
    const saveContact = async () => {
      // Convertir roles a array (si rolesInput es una cadena separada por comas)
      contactForm.value.roles = rolesInput.value.split(',').map(r => r.trim()).filter(r => r)
      if (editMode.value && currentEditingId.value) {
        await updateDoc(doc(db, 'businesses', businessId, 'contacts', currentEditingId.value), { ...contactForm.value })
      } else {
        await addDoc(contactsCol, { ...contactForm.value })
      }
      // Limpiar formulario
      contactForm.value = { name: '', email: '', phone: '', address: '', document: '', roles: [] }
      rolesInput.value = ''
      editMode.value = false
      currentEditingId.value = null
      setActiveTab('contacts')
      await fetchContactsData()
    }

    // Editar contacto: carga la información y cambia a la pestaña "Nuevo Contacto"
    const editContact = (contact) => {
      contactForm.value = { ...contact }
      // Si hay un array de roles, convertirlo a cadena separada por comas para rolesInput
      rolesInput.value = contact.roles ? contact.roles.join(', ') : ''
      editMode.value = true
      currentEditingId.value = contact.id
      setActiveTab('newContact')
    }

    // Eliminar contacto
    const deleteContactById = async (contactId) => {
      await deleteDoc(doc(db, 'businesses', businessId, 'contacts', contactId))
      await fetchContactsData()
    }

    // Cancelar edición de contacto: limpia el formulario y vuelve a la pestaña de listado
    const cancelEdit = () => {
      editMode.value = false
      currentEditingId.value = null
      contactForm.value = { name: '', email: '', phone: '', address: '', document: '', roles: [] }
      rolesInput.value = ''
      setActiveTab('contacts')
    }

    // Funciones para Roles (CRUD)
    const saveRole = async () => {
      if (roleEditMode.value && currentRoleEditingId.value) {
        await updateDoc(doc(db, 'businesses', businessId, 'roles', currentRoleEditingId.value), { ...roleForm.value })
      } else {
        await addDoc(rolesCol, { ...roleForm.value })
      }
      roleForm.value = { name: '' }
      roleEditMode.value = false
      currentRoleEditingId.value = null
      await fetchRoles()
    }

    const editRole = (role) => {
      roleForm.value = { ...role }
      roleEditMode.value = true
      currentRoleEditingId.value = role.id
    }

    const cancelRoleEdit = () => {
      roleEditMode.value = false
      currentRoleEditingId.value = null
      roleForm.value = { name: '' }
    }

    const deleteRole = async (roleId) => {
      await deleteDoc(doc(db, 'businesses', businessId, 'roles', roleId))
      await fetchRoles()
    }

    // Cuando se hace clic en la pestaña "Nuevo Contacto", se limpia el formulario si no está en modo edición
    const setNewContactTab = () => {
      if (!editMode.value) {
        contactForm.value = { name: '', email: '', phone: '', address: '', document: '', roles: [] }
        rolesInput.value = ''
      }
      setActiveTab('newContact')
    }

    // OBSERVAR cambios en activeTab (opcional para debug)
    watch(activeTab, (newVal) => {
      console.log('Cambio de pestaña a:', newVal)
    })

    // Funciones para buscar contactos con rol "cliente"
    const clientContacts = ref([]);
    const selectedCustomerId = ref("");
    const fetchClientContacts = async () => {
      const contactsCol = collection(db, 'businesses', businessId, 'contacts');
      const q = query(contactsCol, where('roles', 'array-contains', 'cliente'));
      const snap = await getDocs(q);
      clientContacts.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };
    const updateCustomer = () => {
      if (selectedCustomerId.value) {
        const client = clientContacts.value.find(c => c.id === selectedCustomerId.value);
        if (client) {
          customer.value = client;
        }
      } else {
        customer.value = {
          name: 'Consumidor Final',
          address: 'N/A',
          phone: 'N/A',
          document: ''
        };
      }
    };

    onMounted(async () => {
      await fetchContactsData();
      await fetchRoles();
      await fetchClientContacts();
    });

    // Funciones para formatear números
    const formatNumber = (value) => {
      return Math.round(value);
    };
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(value);
    };

    return {
      activeTab,
      contacts,
      selectedRole,
      editMode,
      contactForm,
      rolesInput,
      availableRoles,
      roleEditMode,
      roleForm,
      fetchContactsData,
      saveContact,
      editContact,
      deleteContactById,
      cancelEdit,
      saveRole,
      editRole,
      cancelRoleEdit,
      deleteRole,
      setNewContactTab,
      setActiveTab,
      // Variables para búsqueda de clientes
      clientContacts,
      selectedCustomerId,
      updateCustomer,
      // Datos de contactos y roles se retornan para la vista
    }
  }
}
</script>

<style scoped>
/* Puedes personalizar estilos adicionales aquí */
</style>
