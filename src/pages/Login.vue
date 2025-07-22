<!-- src/pages/Login.vue -->
<template>
  <div class="login-wrapper">
    <div class="login-container">
      <h2 class="text-center mb-4">Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-control form-control-sm"
            required
          />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control form-control-sm"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
      </form>
      <p v-if="errorMessage" class="text-danger mt-3 text-center">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Login',
  setup() {
    const email = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const router = useRouter()
    const authStore = useAuthStore()

    // Limpia el store y localStorage al cargar el componente
    onMounted(() => {
      authStore.clear()
      localStorage.clear()
    })

    const handleLogin = async () => {
      errorMessage.value = ''
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
        const user = userCredential.user
        // Obtener información del usuario (incluyendo businessId y role)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Actualizar el store con la información del usuario
          authStore.setUserInfo({
            fullName: userData.fullName,
            userRole: userData.role,
            businessId: userData.businessId
          })
          // Guardar en localStorage (opcional)
          localStorage.setItem('fullName', userData.fullName)
          localStorage.setItem('userRole', userData.role)
          localStorage.setItem('businessId', userData.businessId)

          // Buscar información del negocio y actualizar el store
          const businessDoc = await getDoc(doc(db, 'businesses', userData.businessId))
          if (businessDoc.exists()) {
            const businessData = businessDoc.data()
            authStore.setBusinessInfo(businessData)
            localStorage.setItem('businessInfo', JSON.stringify(businessData))
          } else {
            console.error("No se encontró información del negocio.")
          }

          // Si tienes un turno activo, actualízalo en el store.
          // Por ejemplo, si lo guardas en localStorage o lo obtienes de alguna colección:
          const storedTurnId = localStorage.getItem('currentTurnId') || ''
          authStore.setCurrentTurnId(storedTurnId)
          
          // Redireccionar según el rol del usuario
          console.log('User Role:', userData.role)
          if (userData.role === 'superadmin') {
            router.push('/superadmin/create-business')
          } else if (userData.role === 'owner') {
            router.push('/owner/owner')
          } else if (userData.role === 'admin') {
            router.push('/admin/products')
          } else if (userData.role === 'Inventario') {
            router.push('/inventario/inicio')
          } else if (userData.role === 'manillas') {
            router.push('/manillas/manillas')
          } else {
            router.push('/operative/turn')
          }
        } else {
          errorMessage.value = 'No se encontró información para este usuario.'
        }
      } catch (error) {
        errorMessage.value = error.message
      }
    }

    return { email, password, errorMessage, handleLogin }
  }
}
</script>


<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9ecef;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.main-content {
    margin-left: 1px;
}

</style>
