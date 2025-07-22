// src/composables/useBusinessInfo.js
import { ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useBusinessInfo(businessId) {
  const businessInfo = ref(null)
  
  const fetchBusinessInfo = async () => {
    const docRef = doc(db, 'businesses', businessId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      businessInfo.value = docSnap.data()
    }
  }

  return { businessInfo, fetchBusinessInfo }
}
