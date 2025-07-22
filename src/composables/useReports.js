// src/composables/useReports.js
import { db } from '../firebase'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'

export function useReports(businessId) {
  if (!businessId) {
    throw new Error('El businessId es requerido para usar useReports')
  }

  /**
   * fetchSalesData obtiene los datos de ventas (facturas) entre dos fechas
   * y agrupa los totales diarios.
   *
   * @param {string} startDate - Fecha de inicio en formato "YYYY-MM-DD"
   * @param {string} endDate - Fecha de fin en formato "YYYY-MM-DD"
   * @returns {Array} Array de objetos con { date, amount } ordenados cronológicamente
   */
  const fetchSalesData = async (startDate, endDate) => {
    // Se ajusta para cubrir el día completo
    const start = Timestamp.fromDate(new Date(startDate + 'T00:00:00'))
    const end = Timestamp.fromDate(new Date(endDate + 'T23:59:59'))
    
    const invoicesRef = collection(db, 'businesses', businessId, 'invoices')
    const q = query(invoicesRef, where('createdAt', '>=', start), where('createdAt', '<=', end))
    const querySnapshot = await getDocs(q)
    
    // Agrupación diaria de ventas según el campo 'createdAt'
    const salesDataMap = {}
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data()
      const createdDate = data.createdAt.toDate()
      const dateKey = createdDate.toISOString().split('T')[0]
      
      if (!salesDataMap[dateKey]) {
        salesDataMap[dateKey] = 0
      }
      salesDataMap[dateKey] += data.total || 0
    })
    
    const salesData = Object.keys(salesDataMap).map(date => ({
      date,
      amount: salesDataMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return salesData
  }

  /**
   * fetchProductSalesData obtiene, entre dos fechas, la agregación de ventas
   * por producto a partir del array "cart" de cada factura.
   *
   * Para cada producto se acumula:
   *  - totalUnits: cantidad de unidades vendidas.
   *  - totalRevenue: total en dinero (priceSale * quantity).
   *
   * @param {string} startDate - Fecha de inicio en formato "YYYY-MM-DD"
   * @param {string} endDate - Fecha de fin en formato "YYYY-MM-DD"
   * @returns {Array} Array de objetos con { productId, name, totalUnits, totalRevenue }
   */
  const fetchProductSalesData = async (startDate, endDate) => {
    const start = Timestamp.fromDate(new Date(startDate + 'T00:00:00'))
    const end = Timestamp.fromDate(new Date(endDate + 'T23:59:59'))
    
    const invoicesRef = collection(db, 'businesses', businessId, 'invoices')
    const q = query(invoicesRef, where('createdAt', '>=', start), where('createdAt', '<=', end))
    const querySnapshot = await getDocs(q)
    
    // Objeto para acumular datos por producto.
    const productAggregation = {}
    
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data()
      if (data.cart && Array.isArray(data.cart)) {
        data.cart.forEach(item => {
          // Se define la clave según id, productId o name.
          const key = item.id || item.productId || item.name
          if (!key) return
          if (!productAggregation[key]) {
            productAggregation[key] = {
              name: item.name,
              totalUnits: 0,
              totalRevenue: 0
            }
          }
          productAggregation[key].totalUnits += item.quantity || 0
          productAggregation[key].totalRevenue += (item.priceSale || 0) * (item.quantity || 0)
        })
      }
    })
    
    // Convertir el objeto de agregación en un array.
    const aggregatedData = Object.keys(productAggregation).map(key => ({
      productId: key,
      name: productAggregation[key].name,
      totalUnits: productAggregation[key].totalUnits,
      totalRevenue: productAggregation[key].totalRevenue
    }))
    
    return aggregatedData
  }

  return { fetchSalesData, fetchProductSalesData }
}
