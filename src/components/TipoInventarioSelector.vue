<template>
    <div class="mb-3">
      <label class="form-label">Tipo Inventario</label>
      <div>
        <div class="form-check" v-for="(option, index) in options" :key="index">
          <input
            class="form-check-input"
            type="radio"
            :id="option"
            :value="option"
            v-model="selectedOption"
          />
          <label class="form-check-label" :for="option">
            {{ option }}
          </label>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, watch, onMounted } from 'vue'
  export default {
    name: 'TipoInventarioSelector',
    props: {
      // Se espera recibir el objeto de negocio que se actualizará
      business: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      const options = [
        "unicoConInventario",
        "unicoSinInventario",
        "variadoSinInventario"
      ]
      // Valor inicial basado en la propiedad 'business'
      const selectedOption = ref(
        props.business.turnoConfig && props.business.turnoConfig.tipo
          ? props.business.turnoConfig.tipo
          : options[0]
      )
  
      // Actualiza business.turnoConfig.tipo cada vez que cambia la selección
      watch(selectedOption, (newVal) => {
        if (!props.business.turnoConfig) {
          props.business.turnoConfig = {}
        }
        props.business.turnoConfig.tipo = newVal
      })
  
      // Watcher para detectar cambios en la prop "business"
      watch(
        () => props.business,
        (newBusiness) => {
          if (newBusiness && newBusiness.turnoConfig && newBusiness.turnoConfig.tipo) {
            selectedOption.value = newBusiness.turnoConfig.tipo
          } else {
            selectedOption.value = options[0]
          }
        },
        { deep: true, immediate: true }
      )
  
      // onMounted para establecer el valor al iniciar el componente
      onMounted(() => {
        if (props.business.turnoConfig && props.business.turnoConfig.tipo) {
          selectedOption.value = props.business.turnoConfig.tipo
        }
      })
  
      return { options, selectedOption }
    }
  }
  </script>
  
  <style scoped>
  /* Estilos personalizados si es necesario */
  </style>
  