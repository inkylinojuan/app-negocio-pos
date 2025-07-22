<template>
    <div>
      <InvoiceTemplate
        v-if="businessInfo"
        :businessInfo="businessInfo"
        :invoiceNumber="invoiceNumber"
        :invoiceDate="invoiceDate"
        :paymentMethod="paymentMethod"
        :sellerName="sellerName"
        :dueDate="dueDate"
        :customer="customer"
        :cart="cart"
        :subtotal="subtotal"
        :tax="tax"
        :total="total"
        :deliveryInfo="deliveryInfo"
      />
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import InvoiceTemplate from '../components/InvoiceTemplate.vue'
  import { useBusinessInfo } from '../composables/useBusinessInfo'
  
  export default {
    name: 'PrintInvoice',
    components: { InvoiceTemplate },
    setup() {
      const businessId = localStorage.getItem('businessId')
      const { businessInfo, fetchBusinessInfo } = useBusinessInfo(businessId)
      
      // Estos datos deben ser pasados según la venta real; aquí se usan valores de ejemplo.
      const invoiceNumber = ref(2)
      const invoiceDate = ref(new Date().toLocaleString())
      const paymentMethod = ref('cash')
      const sellerName = ref('Json Ever Guzman')
      const dueDate = ref(new Date().toLocaleDateString())
      const customer = ref({
        name: 'Juan David Guzman Rojas',
        address: 'trv 34 a sur # 32b - 29, Envigado, Antioquia',
        phone: '+57 3000000000',
        document: '98709214-0'
      })
      const cart = ref([]) // Puedes cargar el carrito real desde localStorage o estado global.
      const subtotal = ref(28500)
      const tax = ref(0)
      const total = ref(28500)
      const deliveryInfo = ref({
        address: 'Calle Falsa 123',
        phone: '3000000000'
      })
      
      onMounted(async () => {
        await fetchBusinessInfo()
        // Esperar un poco para asegurar que se renderice la factura y luego llamar a print.
        setTimeout(() => {
          window.print()
        }, 500)
      })
      
      return {
        businessInfo,
        invoiceNumber,
        invoiceDate,
        paymentMethod,
        sellerName,
        dueDate,
        customer,
        cart,
        subtotal,
        tax,
        total,
        deliveryInfo
      }
    }
  }
  </script>
  
  <style scoped>
  /* Puedes agregar estilos adicionales para impresión si lo deseas */
  </style>
  