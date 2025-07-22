<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <!-- Se muestra el nombre del negocio si está definido, o un mensaje de carga -->
      <router-link class="sidebar-brand" to="/">{{ businessInfo.name || 'Cargando negocio...' }}</router-link><br>
      <hr />
      {{ fullName }}<br>
      Rol: {{ userRole || 'Cargando rol...' }}
      <hr />
    </div>
    <ul class="sidebar-menu">
      <!-- Menú para SuperAdmin -->
      <template v-if="userRole === 'superadmin'">
        <li>          
          <router-link to="/superadmin/create-business">Crear Negocio</router-link>
        </li>
        <li>
          <router-link to="/superadmin/qr-management">Qr Management</router-link>
        </li>
      </template>
      <!-- Menú para Admin -->
      <template v-if="userRole === 'admin'">
        <li>
          <router-link to="/admin/products">Productos</router-link>
        </li>
        <li>
          <router-link to="/admin/combos">Menus</router-link>
        </li>
        <li>
          <router-link to="/admin/turns">Turnos</router-link>
        </li>
        <li>
          <router-link to="/admin/expenses">Gastos</router-link>
        </li>
        <li>
          <router-link to="/admin/expensesOpen">Gastos Abiertos</router-link>
        </li>
        <li>
          <router-link to="/admin/incomeOpen">Ingresos Abiertos</router-link>
        </li>
        <li>
          <router-link to="/admin/contacts">Contactos</router-link>
        </li>
        <li>
          <router-link to="/admin/reports">Reportes</router-link>
        </li>
        <li>
          <router-link to="/admin/libro-diario">Libro Diario</router-link>
        </li>
        <li>
          <router-link to="/admin/historico-libro-diario">Historico Libro Diario</router-link>
        </li>
        <li>
          <router-link to="/admin/register-user">Registrar Usuario</router-link>
        </li>
        <li>
          <router-link to="/admin/adminSettings">Configuración</router-link>
        </li>
        <li>
          <router-link to="/admin/statsView">Graficos Manillas</router-link>
        </li>
      </template>
      <!-- Menú para Operativos -->
      <template v-if="userRole === 'operative'">
        <li>
          <router-link to="/operative/turn">Turno</router-link>
        </li>
        <div v-if="currentTurnId">
        <li>
          <router-link to="/operative/pos">Punto de Venta</router-link>
        </li>
        <li>
          <router-link to="/operative/BusinessOrders">Pedidos</router-link>
        </li>
        <li>
          <router-link to="/operative/domicilio">Domicilios</router-link>
        </li>
        <li>
          <router-link :to="`/operative/turn-sales-summary/${currentTurnId}`">
            Resumen de Ventas
          </router-link>
        </li>
        <li>
          <router-link to="/operative/gastos">Gastos</router-link>
        </li>
        <li>
          <router-link to="/operative/contacts">Contactos</router-link>
        </li>
        </div>
      </template>
    </ul>
    <div class="sidebar-footer">
      <button class="btn btn-outline-light btn-sm" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Menu',
  setup() {
    const authStore = useAuthStore()
    // Se usan computed para que sean reactivos
    const businessInfo = computed(() => authStore.businessInfo)
    const userRole = computed(() => authStore.userRole)
    const currentTurnId = computed(() => authStore.currentTurnId)
    const fullName = computed(() => authStore.fullName)
    const router = useRouter()

    onMounted(() => {
      currentTurnId.value = localStorage.getItem('currentTurnId') || ''
      console.log("Current Turn ID:", currentTurnId.value)
      console.log("User Role:", userRole.value)
      console.log("Business Info:", businessInfo.value)
    })

    const logout = async () => {
      await signOut(auth)
      authStore.clear()  // Limpia el store
      router.push('/login')
    }

    return { businessInfo, userRole, currentTurnId, logout, fullName }
  }
}
</script>


<style scoped>
.sidebar {
  height: 100vh;
  width: 250px;
  background-color: #343a40;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  padding: 1rem;
  overflow-y: auto;
}

.sidebar-header {
  margin-bottom: 1rem;
}

.sidebar-brand {
  font-size: 1.5rem;
  color: #fff;
  text-decoration: none;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  margin: 1rem 0;
}

.sidebar-menu li a {
  color: #fff;
  text-decoration: none;
}

.sidebar-footer {
  position: absolute;
  bottom: 1rem;
  width: 100%;
  text-align: center;
}
</style>
