<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <!-- Marca o logo -->
      <div class="navbar-brand" @click="closeMenu">
        <b>Inventario</b>
      </div>
      <!-- Botón responsive -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <!-- Menú -->
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">

          <!-- 1. Activos Fijos -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="dropdownActivosFijos"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Activos Fijos
            </a>
            <ul class="dropdown-menu" aria-labelledby="dropdownActivosFijos">
              <li>
                <router-link class="dropdown-item" to="/fijos/listado" @click="closeMenu">
                  Listado de Activos
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/fijos/crear" @click="closeMenu">
                  Crear Activo
                </router-link>
              </li>
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
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="dropdownPrestamo"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
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
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="dropdownVenta"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
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
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="dropdownConfig"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
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
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: "MenuInventario",
  methods: {
    closeMenu() {
      const collapseEl = document.getElementById("navbarSupportedContent");
      if (collapseEl && window.bootstrap && window.bootstrap.Collapse) {
        const instance = window.bootstrap.Collapse.getInstance(collapseEl);
        (instance || new window.bootstrap.Collapse(collapseEl, { toggle: false })).hide();
      }
    },
  },
};
</script>

<style scoped>
/* Si necesitas ajustes específicos, agrégalos aquí */
</style>
