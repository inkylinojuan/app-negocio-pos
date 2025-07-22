// src/composables/useContacts.js
import { ref } from 'vue'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'

export function useContacts(businessId) {
  const contacts = ref([])

  // Referencia a la colección "contacts" del negocio
  const contactsColRef = collection(db, 'businesses', businessId, 'contacts')

  // Función para obtener contactos. Si se pasa filterRole, se filtra por ese rol usando array-contains.
  const fetchContacts = async (filterRole = null) => {
    let q
    if (filterRole) {
      q = query(contactsColRef, where('roles', 'array-contains', filterRole))
    } else {
      q = query(contactsColRef)
    }
    const querySnapshot = await getDocs(q)
    contacts.value = querySnapshot.docs.map(document => ({ id: document.id, ...document.data() }))
  }

  // Función para agregar un nuevo contacto.
  // Se espera que contactData incluya: name, email, phone y roles (array).
  const addContact = async (contactData) => {
    const docRef = await addDoc(contactsColRef, contactData)
    return docRef.id
  }

  // Función para actualizar un contacto existente.
  const updateContact = async (contactId, updatedData) => {
    const contactDocRef = doc(db, 'businesses', businessId, 'contacts', contactId)
    await updateDoc(contactDocRef, updatedData)
  }

  // Función para eliminar un contacto.
  const deleteContact = async (contactId) => {
    const contactDocRef = doc(db, 'businesses', businessId, 'contacts', contactId)
    await deleteDoc(contactDocRef)
  }

  return { contacts, fetchContacts, addContact, updateContact, deleteContact }
}
