// src/stores/business.js
import { defineStore } from 'pinia'

export const useBusinessStore = defineStore('business', {
  // Estado inicial del store
  state: () => ({
    businessInfo: {}  // Información del negocio
  }),
  // Acciones para modificar el estado
  actions: {
    setBusinessInfo(info) {
      this.businessInfo = info
    }
  },
  // Getters para obtener datos derivados (opcional)
  getters: {
    businessName: (state) => state.businessInfo.name || ''
  }
})
