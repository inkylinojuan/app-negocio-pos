<template>
  <div class="container mt-5">
    <h2>Punto de Venta</h2>
    <div class="row">
      <!-- Columna Izquierda: Productos, Combos y Pestañas -->
      <div class="col-md-8">
        <!-- Pestañas de navegación para filtrar productos/combos -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a
              href="#"
              class="nav-link"
              :class="{ active: activeProductTab === 'sinCategoria' }"
              @click.prevent="activeProductTab = 'sinCategoria'"
            >
              Inicio
            </a>
          </li>
          <li class="nav-item">
            <a
              href="#"
              class="nav-link"
              :class="{ active: activeProductTab === 'combos' }"
              @click.prevent="activeProductTab = 'combos'"
            >
              Menus
            </a>
          </li>
          <li class="nav-item" v-for="cat in categories" :key="cat.id">
            <a
              href="#"
              class="nav-link"
              :class="{ active: activeProductTab === cat.id }"
              @click.prevent="activeProductTab = cat.id"
            >
              {{ cat.name }}
            </a>
          </li>
        </ul>

        <!-- Área de contenido según la pestaña seleccionada -->
        <div v-if="activeProductTab === 'combos'">
          <div class="row">
            <div class="col-md-3 mb-3" v-for="combo in combos" :key="combo.id">
              <div class="card">
                <img
                  :src="combo.imageUrl ? combo.imageUrl : genericImage"
                  class="card-img-top"
                  style="width:200px; height:200px; object-fit:cover;"
                  alt="Combo Image"
                />
                <div class="card-body">
                  <h5 class="card-title">{{ combo.name }}</h5>
                  <p>Precio: {{ combo.priceSale }}</p>
                  <ul>
                    <li v-for="(comp, index) in combo.components" :key="index">
                      {{ getProductName(comp.productId) }} x {{ comp.quantity }}
                    </li>
                  </ul>
                  <button class="btn btn-primary" @click="addComboToCart(combo)">
                    Agregar Combo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="row">
            <div class="col-md-3 mb-3" v-for="product in filteredProducts" :key="product.id">
              <div class="card">
                <img
                  :src="product.imageUrl ? product.imageUrl : genericImage"
                  class="card-img-top"
                  style="width:200px; height:200px; object-fit:cover;"
                  alt="Product Image"
                />
                <div class="card-body">
                  <h5 class="card-title">{{ product.name }}</h5>
                  <p>Precio: {{ product.priceSale }}</p>
                  <button class="btn btn-primary" @click="addToCart(product)">
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Carrito -->
      <div class="col-md-4">
        <div class="sticky-top" style="top: 20px;">
          <!-- Sección Carrito -->
          <div v-if="cart.length > 0">
            <h4>Carrito {{ invoiceNumber }}</h4>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Producto / Combo</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, index) in cart" :key="item.id">
                  <tr>
                    <td>
                      <template v-if="!item.isCombo">
                        {{ item.name }}
                      </template>
                      <template v-else>
                        {{ item.name }} (Combo)
                        <ul>
                          <li v-for="(comp, compIndex) in item.components" :key="compIndex">
                            {{ getProductName(comp.productId) }} x {{ comp.quantity }}
                          </li>
                        </ul>
                      </template>
                    </td>
                    <td>{{ item.quantity }}</td>
                    <td>
                     <input
                       type="number"
                       v-model.number="item.priceSale"
                       class="form-control form-control-sm"
                       min="0"
                     />
                    </td>                    
                    <td>{{ item.quantity * item.priceSale }}</td>
                    <td>
                      <button class="btn btn-danger btn-sm" @click="removeFromCart(index)">Eliminar</button>
                      <button
                        v-if="item.isCombo"
                        class="btn btn-warning btn-sm"
                        @click="toggleEditCombo(index)"
                      >
                        {{ item.isEditing ? 'Cancelar Edición' : 'Editar Combo' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="item.isCombo && item.isEditing">
                    <td colspan="5">
                      <div v-for="(comp, compIndex) in item.editingComponents" :key="compIndex" class="mb-2">
                        <label>Producto:</label>
                        <select
                          v-model="comp.productId"
                          class="form-select d-inline-block"
                          style="width: auto; margin-right:10px;"
                        >
                          <option v-for="prod in products" :key="prod.id" :value="prod.id">
                            {{ prod.name }}
                          </option>
                        </select>
                        <label>Cantidad:</label>
                        <input
                          type="number"
                          v-model.number="comp.quantity"
                          class="form-control d-inline-block"
                          style="width: 80px; margin-right:10px;"
                          min="1"
                        />
                        <!-- Botón para remover este componente -->
                        <button class="btn btn-danger btn-sm" @click="removeComponentFromCombo(index, compIndex)">X</button>
                      </div>
                      <button class="btn btn-success btn-sm" @click="saveComboEdit(index)">
                        Guardar
                      </button>
                      <button class="btn btn-secondary btn-sm" @click="cancelComboEdit(index)">
                        Cancelar
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="3">Total a Pagar</th>
                  <th colspan="2">{{ total }}</th>
                </tr>
              </tfoot>
            </table>
            <!-- Selección de Cliente -->
            <div class="mb-3">
              <label for="customerSelect" class="form-label">Seleccione Cliente:</label>
              <select
                id="customerSelect"
                class="form-select"
                v-model="selectedCustomerId"
                @change="updateCustomer"
              >
                <option value="">Consumidor Final</option>
                <option v-for="client in clientContacts" :key="client.id" :value="client.id">
                  {{ client.name }}
                </option>
              </select>
            </div>
            <!-- Botón para mostrar/ocultar Medios de Pago -->
            <button class="btn btn-success mb-3" @click="togglePayment">
              {{ showPayment ? 'Ocultar Medios de Pago' : 'Cobrar' }}
            </button>
            <!-- Botón para ver/ocultar Factura -->
            <button
              v-if="cart.length > 0"
              class="btn btn-secondary mb-3"
              @click="toggleInvoice"
            >
              {{ showInvoice ? 'Ocultar Factura' : 'Ver Factura' }}
            </button>
          </div>
          <div v-else class="alert alert-info">
            Carrito vacío
          </div>

          <!-- Sección de Medios de Pago -->
          <div v-if="showPayment" class="mt-4">
            <h4>Medios de Pago</h4>
            <div class="btn-group mb-3" role="group">
              <button
                type="button"
                class="btn btn-outline-primary"
                :class="{ active: paymentMethod==='cash' }"
                @click="selectPayment('cash')"
              >
                Efectivo
              </button>
              <button
                type="button"
                class="btn btn-outline-primary"
                :class="{ active: paymentMethod==='qr' }"
                @click="selectPayment('qr')"
              >
                QR / Transferencia
              </button>
              <button
                type="button"
                class="btn btn-outline-primary"
                :class="{ active: paymentMethod==='pending' }"
                @click="selectPayment('pending')"
              >
                Pendiente
              </button>
            </div>

            <div v-if="paymentMethod==='qr'" class="mb-3">
              <label>Adjuntar comprobante de pago:</label>
              <input type="file" class="form-control" @change="handleFileUpload" />
            </div>
            <div v-if="paymentMethod==='cash'" class="mb-3">
              <label>Ingresar efectivo recibido:</label>
              <input type="number" v-model.number="cashReceived" class="form-control" />
              <p v-if="cashReceived >= total">
                Cambio a devolver: {{ change }}
              </p>
              <p v-else class="text-danger" v-if="cashReceived > 0">
                Efectivo insuficiente.
              </p>
            </div>

            <div class="mb-3">
              <button
                type="button"
                class="btn btn-outline-primary"
                :class="{ active: orderType==='delivery' }"
                @click="toggleDelivery"
              >
                Domicilio
              </button>
            </div>
            <div v-if="orderType==='delivery'" class="mb-3">
              <label>Dirección de Entrega:</label>
              <input
                type="text"
                v-model="deliveryInfo.address"
                class="form-control"
                placeholder="Ingrese la dirección de entrega"
              />
              <label class="mt-2">Teléfono de Entrega:</label>
              <input
                type="text"
                v-model="deliveryInfo.phone"
                class="form-control"
                placeholder="Ingrese el teléfono de entrega"
              />
            </div>

            <button
              class="btn btn-primary"
              @click="registerPayment"
              :disabled="isProcessing || (paymentMethod==='cash' && cashReceived < total)"
            >
              Registrar Pago
            </button>
          </div>

          <!-- Sección de Factura Inline -->
          <div
            v-if="showInvoice"
            id="invoice1"
            class="mt-4"
            style="position: relative; z-index: 2;"
          >
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
              :subtotal="total"
              :tax="tax"
              :total="total"
              :deliveryInfo="deliveryInfo"
              :products="products"
            />
            <button class="btn btn-primary mt-3" @click="printInvoice">
              Imprimir Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore'
import { db } from '../firebase'
import InvoiceTemplate from '../components/InvoiceTemplate.vue'
import { useInventory } from '../composables/useInventory'
import { useBusinessInfo } from '../composables/useBusinessInfo'

export default {
  name: 'SalesPOS',
  props: {
    businessId: {
      type: String,
      required: true,
      default: () => localStorage.getItem('businessId') || ''
    }
  },
  components: { InvoiceTemplate },
  setup(props) {
    // Datos de negocio
    const { businessInfo, fetchBusinessInfo } = useBusinessInfo(props.businessId)
    // Productos, combos y carrito
    const products = ref([])
    const combos = ref([])
    const cart = ref([])
    const genericImage = ref('https://via.placeholder.com/300?text=No+Image')

    const voucherFile = ref(null) // para el comprobante QR
    const isProcessing = ref(false)

    function selectPayment(method) {
      paymentMethod.value = method
      if (method !== 'qr') {
        voucherFile.value = null
      }
    }
    function handleFileUpload(event) {
      voucherFile.value = event.target.files[0]
    }
    function toggleDelivery() {
      orderType.value = orderType.value === 'delivery' ? '' : 'delivery'
    }

    // Inventario
    const { updateInventoryAfterSale } = useInventory(props.businessId)

    // Mostrar/ocultar secciones
    const showPayment = ref(false)
    const showInvoice = ref(false)
    const togglePayment = () => { showPayment.value = !showPayment.value }
    const toggleInvoice = () => { showInvoice.value = !showInvoice.value }

    // Cargar productos y combos desde Firestore
    const fetchProducts = async () => {
      const productsCol = collection(db, 'businesses', props.businessId, 'products')
      const snap = await getDocs(productsCol)
      products.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
    const fetchCombos = async () => {
      const combosCol = collection(db, 'businesses', props.businessId, 'combos')
      const snap = await getDocs(combosCol)
      combos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }

    // Gestión de pestañas para filtrar productos
    const activeProductTab = ref('sinCategoria')
    const categories = ref([])
    const fetchCategories = async () => {
      const categoriesCol = collection(db, 'businesses', props.businessId, 'categories')
      const snap = await getDocs(categoriesCol)
      categories.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
    const filteredProducts = computed(() => {
      if (activeProductTab.value === 'sinCategoria') {
        return products.value.filter(p => !p.categoryId || p.categoryId === '')
      } else if (activeProductTab.value !== 'combos') {
        return products.value.filter(p => p.categoryId === activeProductTab.value)
      }
      return []
    })

    // Agregar al carrito
    const addToCart = (product) => {
      const existingItem = cart.value.find(item => item.id === product.id && !item.isCombo)
      if (existingItem) {
        existingItem.quantity++
      } else {
        cart.value.push({ ...product, quantity: 1, isCombo: false })
      }
    }
    const addComboToCart = (combo) => {
      const existingCombo = cart.value.find(item => item.id === combo.id && item.isCombo)
      if (existingCombo) {
        existingCombo.quantity++
      } else {
        cart.value.push({ ...combo, quantity: 1, isCombo: true, isEditing: false })
      }
    }
    const getProductName = (productId) => {
      const prod = products.value.find(p => p.id === productId)
      return prod ? prod.name : productId
    }
    const removeFromCart = (index) => {
      cart.value.splice(index, 1)
    }
    const removeComponentFromCombo = (cartIndex, compIndex) => {
      const item = cart.value[cartIndex]
      if (item.isCombo && item.isEditing) {
        item.editingComponents.splice(compIndex, 1)
        // Aquí podrías recalcular el precio si fuera necesario
      }
    }
    const toggleEditCombo = (index) => {
      const item = cart.value[index]
      if (item.isCombo) {
        if (!item.isEditing) {
          item.editingComponents = JSON.parse(JSON.stringify(item.components))
          item.isEditing = true
        } else {
          item.isEditing = false
          delete item.editingComponents
        }
      }
    }
    const saveComboEdit = (index) => {
      const item = cart.value[index]
      if (item.isCombo && item.isEditing) {
        item.components = item.editingComponents
        item.isEditing = false
        delete item.editingComponents
      }
    }
    const cancelComboEdit = (index) => {
      const item = cart.value[index]
      if (item.isCombo && item.isEditing) {
        item.isEditing = false
        delete item.editingComponents
      }
    }

    // Totales y pago
    const total = computed(() =>
      cart.value.reduce((acc, item) => acc + item.priceSale * item.quantity, 0)
    )
    const paymentMethod = ref('')
    const orderType = ref('')
    const cashReceived = ref(0)
    const normalizedCashReceived = computed(() => {
      const val = Number(cashReceived.value)
      return isNaN(val) ? 0 : val
    })
    const change = computed(() => {
      if (paymentMethod.value === 'cash' && normalizedCashReceived.value >= total.value) {
        return normalizedCashReceived.value - total.value
      }
      return 0
    })
    const isDelivery = ref(false)
    const deliveryInfo = ref({ address: '', phone: '' })

    // Gestión de facturas
    const invoiceNumber = ref(2)
    const getInvoiceNumber = async () => {
      const counterDocRef = doc(db, 'businesses', props.businessId, "counters", "invoices")
      try {
        const productSnap = await getDoc(counterDocRef)
        invoiceNumber.value = productSnap.data().counter + 1
      } catch (e) {
        console.error("Error al obtener el número de factura:", e)
      }
    }
    const getNextInvoiceNumber = async () => {
      const counterDocRef = doc(db, 'businesses', props.businessId, "counters", "invoices")
      try {
        const newInvoiceNumber = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterDocRef)
          if (!counterDoc.exists()) {
            transaction.set(counterDocRef, { counter: 1 })
            return 1
          }
          const currentCounter = counterDoc.data().counter
          const nextCounter = currentCounter + 1
          transaction.update(counterDocRef, { counter: nextCounter })
          return nextCounter
        })
        invoiceNumber.value = newInvoiceNumber
        return newInvoiceNumber
      } catch (e) {
        console.error("Error al obtener el siguiente número de factura:", e)
        return 0
      }
    }

    // Registrar pago y actualizar stock
    const currentTurnId = ref(localStorage.getItem('currentTurnId') || '')
    const currentFullName = ref(localStorage.getItem('fullName') || '')
    const customer = ref({
      name: 'Consumidor Final',
      address: 'NA',
      phone: 'NA',
      document: '888888888-8'
    })
    const registerPayment = async () => {
      if (isProcessing.value) return; // Evita múltiples clics
        isProcessing.value = true;
        try {
      const newInvoiceNumber = await getNextInvoiceNumber()
      const invoiceData = {
        invoiceNumber: newInvoiceNumber,
        cart: cart.value,
        total: total.value,
        paymentMethod: paymentMethod.value,
        orderType: orderType.value === 'delivery' ? 'delivery' : 'normal',
        turnId: currentTurnId.value,
        createdAt: serverTimestamp(),
        customer: customer.value,
        paymentStatus: false,
        deliveryStatus: false,
        sellerName: currentFullName.value,
        dueDate: dueDate.value,
      }
      if (paymentMethod.value === 'cash') {
        invoiceData.cashReceived = Number(cashReceived.value)
        invoiceData.change = Number(cashReceived.value) - total.value
        invoiceData.paymentStatus = true
      } else if (paymentMethod.value === 'qr') {
        invoiceData.paymentStatus = true
        if (voucherFile.value) {
          invoiceData.voucherFile = voucherFile.value.name
        }
      } else if (paymentMethod.value === 'pending') {
        invoiceData.paymentStatus = false
      }
      if (orderType.value === 'delivery') {
        invoiceData.deliveryInfo = deliveryInfo.value
        invoiceData.status = 'pending_delivery'
      } else {
        invoiceData.status = (paymentMethod.value === 'cash' || paymentMethod.value === 'qr')
          ? 'paid'
          : 'pending'
      }

      await addDoc(collection(db, 'businesses', props.businessId, 'invoices'), invoiceData)

      // Actualizar stock de productos y combos
      for (const item of cart.value) {
        if (item.isCombo) {
          for (const comp of item.components) {
            const productDoc = doc(db, 'businesses', props.businessId, 'products', comp.productId)
            const productSnap = await getDoc(productDoc)
            if (productSnap.exists()) {
              const currentStock = productSnap.data().stock || 0
              const newStock = currentStock - (item.quantity * comp.quantity)
              await updateDoc(productDoc, { stock: newStock })
            }
          }
        } else {
          const productDoc = doc(db, 'businesses', props.businessId, 'products', item.id)
          const productSnap = await getDoc(productDoc)
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0
            const newStock = currentStock - item.quantity
            await updateDoc(productDoc, { stock: newStock })
          }
        }
      }

      // Reiniciar variables y carrito
      cart.value = []
      showPayment.value = false
      showInvoice.value = false
      paymentMethod.value = ''
      orderType.value = ''
      cashReceived.value = 0
      isDelivery.value = false
      deliveryInfo.value = { address: '', phone: '' }
      voucherFile.value = null
      await getInvoiceNumber()

      alert('Pago registrado y venta completada.')
    } catch (error) {
        console.error(error);
      } finally {
        isProcessing.value = false;
      }
    }

    // Datos de factura
    const invoiceDate = ref(new Date().toLocaleString())
    const sellerName = ref(currentFullName.value)
    const dueDate = ref(new Date().toLocaleDateString())
    const subtotal = ref(total.value)
    const tax = ref(0)

    const printInvoice = () => {
      const invoiceElement = document.getElementById('invoice')
      if (!invoiceElement) {
        console.error("No se encontró el elemento con id 'invoice'")
        return
      }
      const invoiceContent = invoiceElement.innerHTML
      const printWindow = window.open('', '', 'height=1000,width=800')
      printWindow.document.write('<html><head><title>Factura</title>')
      printWindow.document.write('<style>')
      printWindow.document.write(`
        @page {
          size: 60mm auto;
          margin: 2mm;
        }
        body {
          width: 60mm;
          margin: 0 auto;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 10px;
          margin-top: 20px;
        }
        .invoice-template {
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .header, .invoice-info, .customer-info, .cart-info, .additional-info{
          text-align: center;
          margin: 0.2mm;
          padding: 0;
          line-height: 0.2;
        }
        .footer {
          text-align: center;
          margin: 0.2mm;
          padding: 0;
          line-height: 1.2;
        }
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
        .totals {
          margin-top: 2mm;
          text-align: right;
          line-height: 1.2;
        }
        hr {
          border: none;
          border-top: 1px solid #000;
          margin: 2mm 0;
        }
      `)
      printWindow.document.write('</style>')
      printWindow.document.write('</head><body>')
      printWindow.document.write(invoiceContent)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }

    // Gestión de clientes
    const clientContacts = ref([])
    const selectedCustomerId = ref("")
    const fetchClientContacts = async () => {
      const contactsCol = collection(db, 'businesses', props.businessId, 'contacts')
      const q = query(contactsCol, where('roles', 'array-contains', 'Cliente'))
      const snap = await getDocs(q)
      clientContacts.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
    const updateCustomer = () => {
      if (selectedCustomerId.value) {
        const client = clientContacts.value.find(c => c.id === selectedCustomerId.value)
        if (client) customer.value = client
      } else {
        customer.value = {
          name: 'Consumidor Final',
          address: 'N/A',
          phone: 'N/A',
          document: ''
        }
      }
    }

    onMounted(async () => {
      await fetchBusinessInfo()
      fetchProducts()
      fetchCombos()
      await fetchCategories()
      await fetchClientContacts()
      await getInvoiceNumber()
    })

    return {
      // Datos de negocio y productos
      businessInfo,
      products,
      combos,
      cart,
      genericImage,
      // Pestañas y categorías
      activeProductTab,
      categories,
      filteredProducts,
      // Métodos para carrito y combos
      addToCart,
      addComboToCart,
      getProductName,
      removeFromCart,
      toggleEditCombo,
      saveComboEdit,
      cancelComboEdit,
      removeComponentFromCombo,
      // Totales y métodos de pago
      total,
      paymentMethod,
      selectPayment,
      cashReceived,
      normalizedCashReceived,
      change,
      orderType,
      toggleDelivery,
      // Registro de pago e impresión
      currentTurnId,
      registerPayment,
      invoiceNumber,
      invoiceDate,
      sellerName,
      dueDate,
      customer,
      subtotal,
      tax,
      printInvoice,
      // Gestión de clientes
      clientContacts,
      selectedCustomerId,
      updateCustomer,
      showPayment,
      togglePayment,
      showInvoice,
      toggleInvoice,
      deliveryInfo,
      handleFileUpload,
      registerPayment
    }
  }
}
</script>

<!-- Estilos de impresión (NO SCOPED) -->
<style>
@media print {
  @page {
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }
  body * {
    visibility: hidden !important;
  }
  #invoice, #invoice * {
    visibility: visible !important;
  }
  #invoice {
    position: absolute;
    top: 0;
    left: 0;
    width: 60mm;
    margin: 0;
    padding: 0;
    page-break-before: avoid;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
}
</style>
