<template>
  <div class="container-fluid">
    <div class="row min-vh-100">

      

      <!-- Botón para mostrar/ocultar el sidebar, visible siempre arriba del contenido -->
      <button
        class="btn btn-outline-primary mt-3 ms-3 d-md-none"
        @click="sidebarVisible = !sidebarVisible"
        aria-label="Mostrar/Ocultar menú"
      >
        <!-- Ícono de Bootstrap para menú hamburguesa -->
        <span v-if="!sidebarVisible">
          <i class="bi bi-list"></i> Mostrar menú
        </span>
        <span v-else>
          <i class="bi bi-x-lg"></i> Ocultar menú
        </span>
      </button>

      <!-- Sidebar lateral, visible según sidebarVisible -->
      <nav
        class="col-md-3 col-lg-2 d-md-block bg-light sidebar py-4"
        :class="{ 'd-none': !sidebarVisible && isMobile }"
      >
        <SidebarFijos />

      <!-- Botón para salir del dashboard -->
        <button
          class="btn btn-danger mt-4 mb-3"
          @click="salirDashboard"
        >
          <i class="bi bi-box-arrow-left"></i> Salir
        </button>

      </nav>

      <!-- Contenido principal del dashboard -->
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">

        

        <h1 class="mt-4 mb-4">Dashboard Activos Fijos</h1>
        <div class="row g-4">
          <!-- Tarjeta: Total de activos -->
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ totalActivos }}</h3>
              <p>Total de activos</p>
            </div>
          </div>
          <!-- Tarjeta: Activos por ubicación -->
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ activosPorUbicacion }}</h3>
              <p>Activos por ubicación</p>
            </div>
          </div>
          <!-- Tarjeta: Activos en mantenimiento -->
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ activosEnMantenimiento }}</h3>
              <p>Activos en mantenimiento</p>
            </div>
          </div>
          <!-- Tarjeta: Próximos a depreciación -->
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ activosProximosADepreciacion }}</h3>
              <p>Próximos a depreciación</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import SidebarFijos from './SidebarFijos.vue';

export default {
  name: "DashBoardFijos",
  components: { SidebarFijos },
  data() {
    return {
      sidebarVisible: true,
      totalActivos: 150,
      activosPorUbicacion: 12,
      activosEnMantenimiento: 5,
      activosProximosADepreciacion: 8,
      isMobile: false,
    };
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) {
        this.sidebarVisible = false;
      } else {
        this.sidebarVisible = true;
      }
    },
    // Método para salir del dashboard (redirige a la página de inicio de inventario)
    salirDashboard() {
      this.$router.push('/inventario/inicio');
    },
  },
};
</script>

<style scoped>
.sidebar {
  border-right: 1px solid #dee2e6;
  min-height: 100vh;
}
.card {
  border-radius: 12px;
  text-align: center;
}
/* Asegura que el botón esté por encima del contenido en móvil */
button.btn {
  z-index: 1050;
  position: absolute;
}
</style>