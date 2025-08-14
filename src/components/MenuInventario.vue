<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <!-- Marca o logo -->
      <div class="navbar-brand" @click="closeMenu">
        <b>Inventario</b>
      </div>
      <!-- Botón responsive -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <!-- Menú -->
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">

          <!-- 1. Activos Fijos -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="dropdownActivosFijos" role="button"
              data-bs-toggle="dropdown" aria-expanded="false">
              <!-- en la linea de arriba se elimina un evento que impedia abrir la lista de opciones de activos fijos. -->
              Activos Fijos
            </a>
            <ul class="dropdown-menu" aria-labelledby="dropdownActivosFijos">
               <li> <!--agrego este li de "activos generales" -->
                <router-link class="dropdown-item" to="/fijos/ActivosView" @click="closeMenu">
                  Activos Generales
                </router-link>
              </li>

              <!-- <li>
                <router-link class="dropdown-item" to="/fijos/listado" @click="closeMenu">
                  Listado de Activos
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/fijos/crear" @click="closeMenu">
                  Crear Activo
                </router-link>
              </li> -->
              <li>
                <router-link class="dropdown-item" to="/fijos/asignar-tag" @click="closeMenu">
                  Asignar Tag UHF
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/fijos/ubicaciones" @click="closeMenu">
                  Ubicaciones
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/fijos/historicos" @click="closeMenu">
                  Históricos & Censos
                </router-link>
              </li>
            </ul>
          </li>

          <!-- 2. Activos en Préstamo / Alquiler -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="dropdownPrestamo" role="button" data-bs-toggle="dropdown"
              aria-expanded="false">
              Préstamo / Alquiler
            </a>
            <ul class="dropdown-menu" aria-labelledby="dropdownPrestamo">
              <li>
                <router-link class="dropdown-item" to="/prestamo/categorias" @click="closeMenu">
                  Categorías y Ubicaciones
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/prestamo/crear-activo-movil" @click="closeMenu">
                  Ingresar Activos Moviles
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/prestamo/activos-asignados" @click="closeMenu">
                  Activos Asignados
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/prestamo/ordenes-de-pedido" @click="closeMenu">
                  Ordenes de Pedido
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/prestamo/calendario-disponibilidad" @click="closeMenu">
                  Disponibilidad por Fecha
                </router-link>
              </li>
            </ul>
          </li>

          <!-- 3. Inventario de Venta -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="dropdownVenta" role="button" data-bs-toggle="dropdown"
              aria-expanded="false">
              Inventario Venta
            </a>
            <ul class="dropdown-menu" aria-labelledby="dropdownVenta">
              <li>
                <router-link class="dropdown-item" to="/venta/catalogo" @click="closeMenu">
                  Catálogo de Productos
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/venta/recepcion" @click="closeMenu">
                  Recepción de Mercancía
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/venta/proceso-venta" @click="closeMenu">
                  Proceso de Venta
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/venta/ubicaciones" @click="closeMenu">
                  Ubicaciones de Bodega
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/venta/reportes" @click="closeMenu">
                  Reportes Comerciales
                </router-link>
              </li>
            </ul>
          </li>

          <!-- 4. Configuración (rutas de prueba) -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="dropdownConfig" role="button" data-bs-toggle="dropdown"
              aria-expanded="false">
              Configuración
            </a>
            <ul class="dropdown-menu" aria-labelledby="dropdownConfig">
              <li>
                <router-link class="dropdown-item" to="/inventario/inicio" @click="closeMenu">
                  Activos Disponibles
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/inventario/verActivo" @click="closeMenu">
                  Ver Activo por RFID
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/inventario/all" @click="closeMenu">
                  Lectura Completa
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/inventario/bodegas" @click="closeMenu">
                  Bodegas
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/inventario/IngresarActivos" @click="closeMenu">
                  Ingresar Activos
                </router-link>
              </li>
            </ul>
          </li>

        </ul>
        <!-- agrego Botón de Logout -->
        <button class="btn btn-outline-danger ms-auto" @click="logout">
          Cerrar sesión
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { Collapse, Dropdown } from 'bootstrap';

export default {
  name: "MenuInventario",
  mounted() {
    this.initDropdowns();
  },
  methods: {
    initDropdowns() {
      // Inicializar todos los dropdowns
      this.dropdowns = {};
      const dropdownElements = this.$el.querySelectorAll('.dropdown-toggle');

      dropdownElements.forEach(el => {
        const dropdownId = el.id;
        this.dropdowns[dropdownId] = new Dropdown(el);
      });
    },

    toggleDropdown(dropdownId) {
      if (this.dropdowns[dropdownId]) {
        this.dropdowns[dropdownId].toggle();
      }
    },

    closeMenu() {
      const navbar = this.$refs.navbarCollapse;
      if (navbar && navbar.classList.contains('show')) {
        const bsCollapse = new Collapse(navbar, { toggle: false });
        bsCollapse.hide();
      }

      // Cerrar todos los dropdowns abiertos
      Object.values(this.dropdowns).forEach(dropdown => {
        const menu = dropdown._menu;
        if (menu.classList.contains('show')) {
          dropdown.hide();
        }
      });
    },
    logout() {   //agrego esta funcion par el boton de logout
      localStorage.removeItem('userRole'); // borra el rol
      this.$router.push('/login'); // nos redirige al login
    }

  },
};
</script>

<style scoped>
/* Si necesitas ajustes específicos, agrégalos aquí */
</style>
