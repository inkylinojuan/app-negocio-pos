<template>
  <div class="container mt-5">
    <h2>Registrar Usuario</h2>
    <form @submit.prevent="registerUser" class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Nombre Completo</label>
        <input v-model="newUser.fullName" type="text" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Cédula de Ciudadanía</label>
        <input v-model="newUser.cedula" type="text" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Email</label>
        <input v-model="newUser.email" type="email" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Password</label>
        <input v-model="newUser.password" type="password" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Rol</label>
        <select v-model="newUser.role" class="form-select" required>
          <option value="admin">Admin</option>
          <option value="operative">Operativo</option>
          <option value="manillas">Manilla</option>
        </select>
      </div>
      <div class="col-md-12">
        <button type="submit" class="btn btn-primary">Registrar</button>
      </div>
    </form>
    <p v-if="message" class="mt-3">{{ message }}</p>

    <!-- Listado de Usuarios Registrados -->
    <h3 class="mt-5">Usuarios Registrados</h3>
    <table class="table table-striped mt-3">
      <thead>
        <tr>
          <th>Nombre Completo</th>
          <th>Cédula</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.fullName }}</td>
          <td>{{ user.cedula }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>
            <button class="btn btn-sm btn-warning me-2" @click="openEditModal(user)">Editar</button>
            <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para editar usuario -->
    <div class="modal fade" tabindex="-1" :class="{ show: showEditModal }" style="display: block;" v-if="showEditModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar Usuario</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateUser">
              <div class="mb-3">
                <label class="form-label">Nombre Completo</label>
                <input v-model="editUser.fullName" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Cédula de Ciudadanía</label>
                <input v-model="editUser.cedula" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="editUser.email" type="email" class="form-control" required disabled />
              </div>
              <div class="mb-3">
                <label class="form-label">Rol</label>
                <select v-model="editUser.role" class="form-select" required>
                  <option value="admin">Admin</option>
                  <option value="operative">Operativo</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </form>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore'

export default {
  name: 'RegisterUser',
  setup() {
    const newUser = ref({
      fullName: '',
      cedula: '',
      email: '',
      password: '',
      role: 'operative'
    })
    const message = ref('')
    const businessId = localStorage.getItem('businessId') || ''

    // Lista de usuarios registrados
    const users = ref([])

    // Variables para el modal de edición
    const showEditModal = ref(false)
    const editUser = ref({})

    // Registrar usuario: crea el usuario en Firebase Auth y guarda la info en Firestore
    const registerUser = async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newUser.value.email,
          newUser.value.password
        )
        const user = userCredential.user
        await setDoc(doc(db, 'users', user.uid), {
          fullName: newUser.value.fullName,
          cedula: newUser.value.cedula,
          email: newUser.value.email,
          role: newUser.value.role,
          businessId: businessId,
          createdAt: serverTimestamp()
        })
        message.value = 'Usuario registrado exitosamente.'
        // Reiniciar el formulario
        newUser.value = {
          fullName: '',
          cedula: '',
          email: '',
          password: '',
          role: 'operative'
        }
      } catch (error) {
        message.value = error.message
      }
    }

    // Función para cargar los usuarios registrados (opcionalmente filtrados por businessId)
    const fetchUsers = () => {
      const usersCollection = collection(db, 'users')
      onSnapshot(usersCollection, snapshot => {
        let registeredUsers = []
        snapshot.forEach(doc => {
          const data = doc.data()
          if (!businessId || data.businessId === businessId) {
            registeredUsers.push({ id: doc.id, ...data })
          }
        })
        users.value = registeredUsers
      })
    }

    // Eliminar usuario
    const deleteUser = async (id) => {
      if (confirm('¿Está seguro de eliminar este usuario?')) {
        try {
          await deleteDoc(doc(db, 'users', id))
          alert('Usuario eliminado.')
        } catch (error) {
          console.error('Error eliminando usuario: ', error)
        }
      }
    }

    // Abrir modal para editar usuario
    const openEditModal = (user) => {
      editUser.value = { ...user }
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
    }

    // Actualizar usuario en Firestore
    const updateUser = async () => {
      try {
        const userDoc = doc(db, 'users', editUser.value.id)
        await updateDoc(userDoc, {
          fullName: editUser.value.fullName,
          cedula: editUser.value.cedula,
          role: editUser.value.role
        })
        alert('Usuario actualizado.')
        closeEditModal()
      } catch (error) {
        console.error('Error actualizando usuario: ', error)
      }
    }

    onMounted(() => {
      fetchUsers()
    })

    return {
      newUser,
      registerUser,
      message,
      users,
      deleteUser,
      openEditModal,
      closeEditModal,
      showEditModal,
      editUser,
      updateUser
    }
  }
}
</script>

<style scoped>
.modal {
  display: block; /* Forzamos la visualización del modal */
  background: none;
}
/* Aseguramos que el modal-dialog esté por encima del backdrop */
.modal-dialog {
  z-index: 1050;
}

/* El backdrop sigue con el fondo gris */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}
</style>

  