<template>
  <!-- 1) Login “puro”: si estamos en /login, ni wrapper ni menú -->
  <router-view v-if="route.path === '/login' || route.path.startsWith('/manillas')" />

  <!-- 2) Resto de rutas: aplicamos layout -->
  <div v-else :style="mainContentStyle">
    <!-- Sólo renderizamos el menú cuando showMenu sea true -->
    <Menu v-if="showMenu" />

    <!-- Contenido principal -->
    <div>
      <router-view />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Menu from './components/Menu.vue'
import { auth } from './firebase'

export default {
  name: 'App',
  components: { Menu },
  setup() {
    const authStore = useAuthStore()
    const route     = useRoute()

    const isLoggedIn   = ref(false)
    const isInventario = ref(false)
    const isManilla    = ref(false)
    const isSidebarCollapsed = ref(false)

    // Computed para el rol desde el store
    const userRole = computed(() => authStore.userRole)

    // Cuando cambia el estado de auth, actualizamos flags
    onAuthStateChanged(auth, user => {
      isLoggedIn.value   = !!user
      isInventario.value = user && userRole.value === 'Inventario'
      isManilla.value    = user && userRole.value === 'Manilla'
    })

    // Escuchar eventos del sidebar
    onMounted(() => {
      window.addEventListener('sidebar-toggle', (event) => {
        isSidebarCollapsed.value = event.detail.isCollapsed
      })
    })

    // Nuevo: sólo mostramos menú si NO somos Inventario ni Manilla
    const showMenu = computed(() =>
      isLoggedIn.value && !isInventario.value && !isManilla.value
    )

    // Computed para estilos, usando showMenu para el margen
    const mainContentStyle = computed(() => {
      // Login → sin margen ni padding
      if (route.path === '/login' || route.path === '/manillas') {
        return { marginLeft: '0px', padding: '0rem' }
      }
      // Rutas especiales (si tuvieras más) → sin margen
      if (
        route.path.startsWith('/inventario') ||
        route.path.startsWith('/manillas')
      ) {
        isInventario.value = true
        return { marginLeft: '0px', padding: '0rem' }
      }
      // Sólo si mostramos menú → dejamos espacio
      if (showMenu.value) {
        const marginLeft = isSidebarCollapsed.value ? '50px' : '250px'
        return { marginLeft, padding: '1rem', transition: 'margin-left 0.3s ease' }
      }
      // En cualquier otro caso → sin margen
      return { marginLeft: '0px', padding: '0rem' }
    })

    return {
      route,
      showMenu,
      mainContentStyle
    }
  }
}
</script>

<style>
html, body {
  margin: 2px;
}
</style>
