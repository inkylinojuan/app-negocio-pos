<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="d-flex justify-content-between align-items-center">
        <router-link class="sidebar-brand" to="/">
          <i class="bi bi-shop me-2"></i>{{ businessInfo.name || 'Cargando negocio...' }}
        </router-link>
        <button class="btn btn-sm btn-outline-light" @click="toggleSidebar">
          <i class="bi bi-list"></i>
        </button>
      </div>
      <hr />
      {{ fullName }}<br>
      Rol: {{ userRole || 'Cargando rol...' }}
      <hr />
    </div>
    <ul class="sidebar-menu">
      <!-- Menú para SuperAdmin -->
      <template v-if="userRole === 'superadmin'">
        <li>          
          <router-link to="/superadmin/create-business">
            <i class="bi bi-building-add me-2"></i>Crear Negocio
          </router-link>
        </li>
        <li>
          <router-link to="/superadmin/qr-management">
            <i class="bi bi-qr-code me-2"></i>Qr Management
          </router-link>
        </li>
      </template>
      <!-- Menú para Admin -->
      <template v-if="userRole === 'admin'">
        <li>
          <router-link to="/admin/products">
            <i class="bi bi-box me-2"></i>Productos
          </router-link>
        </li>
        <li>
          <router-link to="/admin/combos">
            <i class="bi bi-list-ul me-2"></i>Menus
          </router-link>
        </li>
        <li>
          <router-link to="/admin/turns">
            <i class="bi bi-clock me-2"></i>Turnos
          </router-link>
        </li>
        <li>
          <router-link to="/admin/expenses">
            <i class="bi bi-cash-stack me-2"></i>Gastos
          </router-link>
        </li>
        <li>
          <router-link to="/admin/expensesOpen">
            <i class="bi bi-cash-coin me-2"></i>Gastos Abiertos
          </router-link>
        </li>
        <li>
          <router-link to="/admin/incomeOpen">
            <i class="bi bi-wallet2 me-2"></i>Ingresos Abiertos
          </router-link>
        </li>
        <li>
          <router-link to="/admin/contacts">
            <i class="bi bi-people me-2"></i>Contactos
          </router-link>
        </li>
        <li>
          <router-link to="/admin/reports">
            <i class="bi bi-graph-up me-2"></i>Reportes
          </router-link>
        </li>
        <li>
          <router-link to="/admin/libro-diario">
            <i class="bi bi-journal-text me-2"></i>Libro Diario
          </router-link>
        </li>
        <li>
          <router-link to="/admin/historico-libro-diario">
            <i class="bi bi-journal-check me-2"></i>Historico Libro Diario
          </router-link>
        </li>
        <li>
          <router-link to="/admin/register-user">
            <i class="bi bi-person-plus me-2"></i>Registrar Usuario
          </router-link>
        </li>
        <li>
          <router-link to="/admin/adminSettings">
            <i class="bi bi-gear me-2"></i>Configuración
          </router-link>
        </li>
        <li>
          <router-link to="/admin/statsView">
            <i class="bi bi-pie-chart me-2"></i>Graficos Manillas
          </router-link>
        </li>
      </template>
      <!-- Menú para Operativos -->
      <template v-if="userRole === 'operative'">
        <li>
          <router-link to="/operative/turn">
            <i class="bi bi-clock-history me-2"></i>Turno
          </router-link>
        </li>
        <div v-if="currentTurnId">
        <li>
          <router-link to="/operative/pos">
            <i class="bi bi-cash-register me-2"></i>Punto de Venta
          </router-link>
        </li>
        <li>
          <router-link to="/operative/BusinessOrders">
            <i class="bi bi-cart me-2"></i>Pedidos
          </router-link>
        </li>
        <li>
          <router-link to="/operative/domicilio">
            <i class="bi bi-truck me-2"></i>Domicilios
          </router-link>
        </li>
        <li>
          <router-link :to="`/operative/turn-sales-summary/${currentTurnId}`">
            <i class="bi bi-receipt me-2"></i>Resumen de Ventas
          </router-link>
        </li>
        <li>
          <router-link to="/operative/gastos">
            <i class="bi bi-cash-stack me-2"></i>Gastos
          </router-link>
        </li>
        <li>
          <router-link to="/operative/contacts">
            <i class="bi bi-people me-2"></i>Contactos
          </router-link>
        </li>
        </div>
      </template>
    </ul>
    <div class="sidebar-footer">
      <button class="btn btn-outline-light btn-sm" @click="logout">
        <i class="bi bi-box-arrow-right me-1"></i>Logout
      </button>
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
    
    // Estado del sidebar
    const isCollapsed = ref(false)

    onMounted(() => {
      currentTurnId.value = localStorage.getItem('currentTurnId') || ''
      console.log("Current Turn ID:", currentTurnId.value)
      console.log("User Role:", userRole.value)
      console.log("Business Info:", businessInfo.value)
    })

    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value
      // Emitir evento para que App.vue sepa el estado
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { 
        detail: { isCollapsed: isCollapsed.value } 
      }))
    }

    const logout = async () => {
      await signOut(auth)
      authStore.clear()  // Limpia el store
      router.push('/login')
    }

    return { businessInfo, userRole, currentTurnId, logout, fullName, isCollapsed, toggleSidebar }
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
  transition: transform 0.3s ease;
  z-index: 1000;
}

.sidebar.collapsed {
  transform: translateX(-200px);
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
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  transition: all 0.3s ease;
}

.sidebar-menu li a:hover {
  color: #17a2b8;
  transform: translateX(5px);
}

.sidebar-menu li a i {
  width: 20px;
  text-align: center;
}

.sidebar-footer {
  position: absolute;
  bottom: 1rem;
  width: 100%;
  text-align: center;
}

/* Botón hamburguesa */
.btn-outline-light {
  border-color: #fff;
  color: #fff;
}

.btn-outline-light:hover {
  background-color: #fff;
  color: #343a40;
}
</style>
