<template>
  <ul class="nav flex-column">
    <li class="nav-item">
      <router-link class="nav-link" to="/fijos/ActivosView" active-class="active">Activos Generales</router-link>
    </li>
    <li class="nav-item">
      <router-link class="nav-link" to="/fijos/asignar-tag" active-class="active">Asignar Tag UHF</router-link>
    </li>
    <li class="nav-item">
      <router-link class="nav-link" to="/fijos/ubicaciones" active-class="active">Ubicaciones</router-link>
    </li>
    <li class="nav-item">
      <router-link class="nav-link" to="/fijos/historicos" active-class="active">Históricos & Censos</router-link>
    </li>
  </ul>
</template>

<style scoped>
.nav-link.active {
  font-weight: bold;
  color: #0d6efd !important;
  background: #e3f2fd;
  border-radius: 6px;
}
</style>