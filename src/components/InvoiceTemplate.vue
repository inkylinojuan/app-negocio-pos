<template>
    <div id="invoice" class="invoice-template">
      <!-- Encabezado del Negocio -->
      <div class="header">
        <p>{{ businessInfo.name }}</p>
        <p>{{ businessInfo.person }}</p>
        <p>{{ businessInfo.nit }}</p>
        <p>{{ businessInfo.address }}</p>
        <p>{{ businessInfo.phone }}</p>
        <p>{{ businessInfo.email }}</p>
        <p>{{ businessInfo.taxRegime }}</p>
      </div>
      <hr class="compact-hr"/>
      <!-- Datos de la Factura -->
      <div class="invoice-info">
        <p><strong>Factura de Venta</strong></p>
        <p>N°: {{ invoiceNumber }}</p>
        <p>Fecha de emisión: {{ invoiceDate }}</p>
        <p>Forma de pago: {{ paymentMethodDisplay }}</p>
        <p>Método de pago: {{ paymentMethod }}</p>
        <p>Vendedor: {{ sellerName }}</p>
        <p>Vencimiento: {{ dueDate }}</p>
      </div>
      <hr class="compact-hr"/>
      <!-- Información del Cliente -->
      <div class="customer-info">
        <p><strong>Información del Cliente</strong></p>
        <p>{{ customer.name }}</p>
        <p>{{ customer.address }}</p>
        <p>{{ customer.phone }}</p>
        <p>{{ customer.document }}</p>
      </div>
      <hr class="compact-hr"/>
      <!-- Detalle de la Venta -->
      <div class="cart-info">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>P.Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in cart" :key="index">
              <td>
                <template v-if="!item.isCombo">
                  {{ item.name }}
                </template>
                <template v-else>
                  {{ item.name }} (Combo)
                  <!-- Sublista con detalles del combo -->
                  <ul>
                    <li v-for="(comp, compIndex) in item.components" :key="compIndex">
                      {{ getProductName(comp.productId) }} x {{ comp.quantity }}
                    </li>
                  </ul>
                </template>
              </td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatCurrency(formatNumber(item.priceSale)) }}</td>
              <td>{{ formatCurrency(formatNumber(item.priceSale * item.quantity)) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="totals">
          Subtotal: {{ formatCurrency(formatNumber(subtotal)) }}<br>
          Impuestos: {{ formatCurrency(tax) }}<br>
          <strong>Total: {{ formatCurrency(formatNumber(total)) }}</strong>
        </div>
      </div>
      <hr class="compact-hr"/>
      <!-- Información Adicional para Domicilios -->
      <div class="additional-info" v-if="deliveryInfo.address >= '0'">
        <p><strong>Información de Domicilio</strong></p>
        <p>Dirección de entrega: {{ deliveryInfo.address }}</p>
        <p>Teléfono: {{ deliveryInfo.phone }}</p>
        <p><strong>Venta para domicilio</strong></p>
      </div>
      <hr class="compact-hr"/>
      <!-- Pie de Factura -->
      <div class="footer">
        <p>{{ businessInfo.invoiceFooter }}</p>
        <!--<p>Facturador: {{ businessInfo.facturador }}</p>-->
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'InvoiceTemplate',
    props: {
      paymentMethod: {
        type: String,
        required: true,
        default: ''
      },
      businessInfo: { type: Object, required: true },
      invoiceNumber: { type: Number, required: true },
      invoiceDate: { type: String, required: true },
      sellerName: { type: String, required: true },
      dueDate: { type: String, required: true },
      customer: { type: Object, required: true },
      cart: { type: Array, required: true },
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      total: { type: Number, required: true },
      deliveryInfo: { type: Object, default: () => ({ address: '', phone: '' }) },
      products: { type: Array, required: true } // Se agrega la lista de productos
    },
    computed: {
      paymentMethodDisplay() {
        if (this.paymentMethod === 'cash') return 'Contado'
        else if (this.paymentMethod === 'qr') return 'QR/Transferencia'
        else if (this.paymentMethod === 'delivery') return 'Domicilio'
        return this.paymentMethod
      }
    },
    methods: {
      formatNumber(value) {
        // Redondea el valor sin decimales
        return Math.round(value);
      },
      formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0
        }).format(value);
      },
      getProductName(productId) {
        // Busca el producto en la lista de productos y retorna su nombre
        const prod = this.products.find(p => p.id === productId);
        return prod ? prod.name : productId;
      }
    }
  }
  </script>
  
  <style scoped>
  /* Estilos generales para la factura */
  .invoice-template {
    width: 80mm;
    font-family: Arial, sans-serif;
    font-size: 10px;
    margin: 0 auto;
    padding: 5px;
  }
  
  /* Compactar encabezados y párrafos */
  .header, .invoice-info, .customer-info, .cart-info, .additional-info, .footer {
    text-align: center;
    margin: 0;
    padding: 0;
  }
  
  .header p, .invoice-info p, .customer-info p, .additional-info p, .footer p {
    margin: 0;
    line-height: 1.2;
  }
  
  /* Compactar la tabla */
  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
  .table th, .table td {
    border: none;
    padding: 1px;
    text-align: center;
  }
  
  /* Compactar totales */
  .totals {
    text-align: right;
  }
  
  /* Compactar líneas horizontales */
  .compact-hr {
    margin: 3px 0;
  }
  
  /* Estilos para impresión */
  @media print {
    body * {
      visibility: hidden;
    }
    #invoice, #invoice * {
      visibility: visible;
    }
    #invoice {
      position: absolute;
      left: 0;
      top: 0;
      width: 80mm;
      margin: 0;
      padding: 0;
    }
    .invoice-template {
      box-shadow: none;
      border: none;
      background: none;
    }
    .table {
      page-break-inside: avoid;
    }
  }
  </style>
  