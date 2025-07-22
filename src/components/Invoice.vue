<!-- src/components/Invoice.vue -->
<template>
    <div class="invoice border p-3 mb-3">
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in cart" :key="index">
            <td>
              <div v-if="!item.isCombo">{{ item.name }}</div>
              <div v-else>
                {{ item.name }} (Combo)
                <ul>
                  <li v-for="(comp, idx) in item.components" :key="idx">
                    {{ getProductName(comp.productId) }} x {{ comp.quantity }}
                  </li>
                </ul>
              </div>
            </td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.priceSale }}</td>
            <td>{{ item.quantity * item.priceSale }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th colspan="3">Total</th>
            <th>{{ total }}</th>
          </tr>
        </tfoot>
      </table>
      <p><strong>Medio de pago:</strong> {{ paymentMethodDisplay }}</p>
      <p v-if="paymentMethod==='cash'">
        <strong>Efectivo recibido:</strong> {{ cashReceived }}<br />
        <strong>Cambio:</strong> {{ change }}
      </p>
      <p v-if="isDelivery">
        <em>Factura en estado de Domicilio (pendiente de confirmación)</em>
      </p>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Invoice',
    props: {
      cart: { type: Array, required: true },
      total: { type: Number, required: true },
      paymentMethod: { type: String, required: true },
      cashReceived: { type: Number, default: 0 },
      change: { type: Number, default: 0 },
      isDelivery: { type: Boolean, default: false }
    },
    computed: {
      paymentMethodDisplay() {
        switch (this.paymentMethod) {
          case 'cash': return 'Efectivo'
          case 'qr': return 'QR / Transferencia'
          case 'delivery': return 'Domicilio'
          default: return ''
        }
      }
    },
    methods: {
      // Aquí puedes agregar una función para obtener el nombre del producto;
      // en este ejemplo, se asume que el producto ya se encuentra en el carrito.
      getProductName(productId) {
        return productId
      }
    }
  }
  </script>
  
  <style scoped>

  </style>
  