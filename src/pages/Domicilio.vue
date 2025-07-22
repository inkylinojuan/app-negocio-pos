<!-- src/pages/Domicilio.vue -->
<template>
    <div class="container mt-5">
      <h2>Pedidos de Domicilio</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Factura ID</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td>{{ invoice.id }}</td>
            <td>{{ invoice.total }}</td>
            <td>{{ invoice.status ? invoice.status : 'Pendiente' }}</td>
            <td>
              <button class="btn btn-success btn-sm" @click="markAsPaid(invoice.id)">
                Marcar como Pagado
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
  import { db } from '../firebase'
  
  export default {
    name: 'Domicilio',
    setup() {
      const invoices = ref([])
      const businessId = localStorage.getItem('businessId') || ''
  
      const fetchInvoices = async () => {
        const invoicesCol = collection(db, 'businesses', businessId, 'invoices')
        // Filtrar las facturas de domicilio (paymentMethod === 'delivery')
        const q = query(invoicesCol, where('paymentMethod', '==', 'delivery'))
        const snap = await getDocs(q)
        invoices.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }
  
      const markAsPaid = async (invoiceId) => {
        const invoiceDoc = doc(db, 'businesses', businessId, 'invoices', invoiceId)
        await updateDoc(invoiceDoc, { status: 'paid' })
        fetchInvoices()
      }
  
      onMounted(() => {
        fetchInvoices()
      })
  
      return { invoices, markAsPaid }
    }
  }
  </script>
  