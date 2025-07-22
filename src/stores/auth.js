// src/stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    fullName: localStorage.getItem('fullName') || '',
    userRole: localStorage.getItem('userRole') || '',
    businessId: localStorage.getItem('businessId') || '',
    businessInfo: localStorage.getItem('businessInfo')
      ? JSON.parse(localStorage.getItem('businessInfo'))
      : {},
    currentTurnId: localStorage.getItem('currentTurnId') || ''
  }),
  actions: {
    setUserInfo({ fullName, userRole, businessId }) {
      this.fullName = fullName
      this.userRole = userRole
      this.businessId = businessId
      localStorage.setItem('fullName', fullName)
      localStorage.setItem('userRole', userRole)
      localStorage.setItem('businessId', businessId)
    },
    setBusinessInfo(businessInfo) {
      this.businessInfo = businessInfo
      localStorage.setItem('businessInfo', JSON.stringify(businessInfo))
    },
    setCurrentTurnId(turnId) {
      this.currentTurnId = turnId
      localStorage.setItem('currentTurnId', turnId)
    },
    clear() {
      this.fullName = ''
      this.userRole = ''
      this.businessId = ''
      this.businessInfo = {}
      this.currentTurnId = ''
      localStorage.clear()
    }
  },
  getters: {
    isAdmin: (state) => state.userRole === 'admin',
    isSuperAdmin: (state) => state.userRole === 'superadmin'
  }
})
