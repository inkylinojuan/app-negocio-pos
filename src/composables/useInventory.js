// src/composables/useInventory.js
import { ref } from 'vue'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, doc, increment } from 'firebase/firestore'

export function useInventory(businessId) {
  const productos = ref([])

  // Obtiene todos los productos para el negocio
  const getProductos = async () => {
    const querySnapshot = await getDocs(collection(db, 'businesses', businessId, 'productos'))
    productos.value = querySnapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }))
  }

  // Agrega un nuevo producto
  const addProducto = async (producto) => {
    const docRef = await addDoc(collection(db, 'businesses', businessId, 'productos'), producto)
    return docRef.id
  }

  // Actualiza un producto existente
  const updateProducto = async (id, updatedData) => {
    const productoRef = doc(db, 'businesses', businessId, 'productos', id)
    await updateDoc(productoRef, updatedData)
  }

  // Actualiza el inventario luego de procesar una venta
  // saleItems es un arreglo de objetos: { productId, quantity }
  // user es el identificador del usuario que realizó la venta
  const updateInventoryAfterSale = async (saleItems, user) => {
    const promises = saleItems.map(async (item) => {
      const productoRef = doc(db, 'businesses', businessId, 'productos', item.productId)
      // Resta la cantidad vendida del stock
      await updateDoc(productoRef, {
        cantidad: increment(-item.quantity)
      })
      // Registra el movimiento de inventario
      await addDoc(collection(db, 'businesses', businessId, 'movimientos'), {
        idProducto: item.productId,
        tipo: 'salida',
        cantidad: item.quantity,
        fecha: new Date(),
        usuario: user,
        motivo: 'venta'
      })
    })
    await Promise.all(promises)
  }

  return { productos, getProductos, addProducto, updateProducto, updateInventoryAfterSale }
}
