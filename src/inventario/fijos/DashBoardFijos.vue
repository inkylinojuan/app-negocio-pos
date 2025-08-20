<template>
  <div class="container-fluid">
    <div class="row min-vh-100">
      <button
        class="btn btn-outline-primary mt-3 ms-3 d-md-none"
        @click="sidebarVisible = !sidebarVisible"
        aria-label="Mostrar/Ocultar menú"
      >
        <span v-if="!sidebarVisible">
          <i class="bi bi-list"></i> Mostrar menú
        </span>
        <span v-else>
          <i class="bi bi-x-lg"></i> Ocultar menú
        </span>
      </button>

      <nav
        class="col-md-3 col-lg-2 d-md-block bg-light sidebar py-4"
        :class="{ 'd-none': !sidebarVisible && isMobile }"
      >
        <SidebarFijos />
        <button class="btn btn-danger mt-4 mb-3" @click="salirDashboard">
          <i class="bi bi-box-arrow-left"></i> Salir
        </button>
      </nav>

      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
        <h1 class="mt-4 mb-4">Dashboard Activos Fijos</h1>
        <div class="row g-4">
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ totalActivos }}</h3>
              <p>Total de activos</p>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ activosPorUbicacion }}</h3>
              <p>Total de ubicaciones</p>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ activosEnMantenimiento }}</h3>
              <p>Activos en mantenimiento</p>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card shadow-sm p-3">
              <h3>{{ activosEnBuenEstado }}</h3>
              <p>Activos en buen estado</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import SidebarFijos from './SidebarFijos.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useRouter } from 'vue-router';

export default {
  name: "DashBoardFijos",
  components: { SidebarFijos },
  setup() {
    const router = useRouter();
    const sidebarVisible = ref(true);
    const isMobile = ref(false);

    // Variables reactivas para los datos del dashboard
    const totalActivos = ref(0);
    const activosPorUbicacion = ref(0);
    const activosEnMantenimiento = ref(0);
    const activosEnBuenEstado = ref(0);

    let unsubscribeAssets = null;
    let unsubscribeLocations = null;

    // Conecta a la base de datos y escucha cambios en tiempo real
    const fetchData = () => {
      // Escucha la colección de 'assets'
      unsubscribeAssets = onSnapshot(collection(db, 'assets'), (snapshot) => {
        const assetsData = snapshot.docs.map(doc => doc.data());
        totalActivos.value = assetsData.length;
        activosEnMantenimiento.value = assetsData.filter(asset => asset.status === 'en_mantenimiento').length;
        activosEnBuenEstado.value = assetsData.filter(asset => asset.status === 'disponible').length;
      }, (error) => {
        console.error("Error al escuchar cambios en activos:", error);
      });

      // Escucha la colección de 'locations'
      unsubscribeLocations = onSnapshot(collection(db, 'locations'), (snapshot) => {
        activosPorUbicacion.value = snapshot.docs.length;
      }, (error) => {
        console.error("Error al escuchar cambios en ubicaciones:", error);
      });
    };

    // Lógica para detectar el tamaño de la pantalla
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 768;
      if (isMobile.value) {
        sidebarVisible.value = false;
      } else {
        sidebarVisible.value = true;
      }
    };

    // Método para salir del dashboard
    const salirDashboard = () => {
      router.push('/inventario/inicio');
    };

    onMounted(() => {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      fetchData();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile);
      // Detiene los escuchadores de Firestore para evitar fugas de memoria
      if (unsubscribeAssets) unsubscribeAssets();
      if (unsubscribeLocations) unsubscribeLocations();
    });

    return {
      sidebarVisible,
      totalActivos,
      activosPorUbicacion,
      activosEnMantenimiento,
      activosEnBuenEstado, // Nueva variable expuesta
      isMobile,
      salirDashboard,
    };
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