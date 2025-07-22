<!-- src/components/InventoryManager.vue -->
<template>
    <div>
      <h2>Gestión de Inventario</h2>
      <ul>
        <li v-for="producto in productos" :key="producto.id">
          {{ producto.nombre }} - Stock: {{ producto.cantidad }}
          <!-- Botones para editar y registrar movimientos -->
        </li>
      </ul>
      <!-- Formulario para agregar o editar productos -->
    </div>
  </template>
  
  <script>
  import { onMounted } from 'vue'
  import { useInventory } from '../composables/useInventory'
  
  export default {
    name: 'InventoryManager',
    setup() {
      const { productos, getProductos } = useInventory()
  
      onMounted(() => {
        getProductos()
      })
  
      return { productos }
    }
  }
  </script>
  