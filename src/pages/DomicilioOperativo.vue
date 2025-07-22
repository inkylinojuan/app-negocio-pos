<!-- src/pages/DomicilioOperativo.vue -->
<template>
  <div class="container mt-5">
    <h2>Pedidos de Domicilio (Operativo)</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Número de Factura</th>
          <th>Fecha y Hora</th>
          <th>Total</th>
          <th>Dirección</th>
          <th>Teléfono</th>
          <th>Estado del Pedido</th>
          <th>Estado de Pago</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="invoice in invoices" :key="invoice.id">
          <td>{{ invoice.invoiceNumber || invoice.id }}</td>
          <td>{{ invoice.createdAt ? formatDate(invoice.createdAt) : '' }}</td>
          <td>{{ invoice.total }}</td>
          <td>{{ invoice.deliveryInfo?.address || '-' }}</td>
          <td>{{ invoice.deliveryInfo?.phone || '-' }}</td>
          <td>{{ invoice.status }}</td>
          <td>
            <span v-if="invoice.paymentStatus" class="text-success">Pagado</span>
            <span v-else class="text-danger">No Pagado</span>
          </td>
          <td>
            <button class="btn btn-info btn-sm" @click="viewInvoice(invoice)">
              Ver Factura
            </button>
            <!-- Mostrar botón para confirmar entrega:
                 Si el estado es 'pending_delivery' se abre el modal.
                 Este botón siempre se muestra para facturas pendientes de entrega -->
            <button
              v-if="invoice.status === 'pending_delivery'"
              class="btn btn-success btn-sm ms-2"
              @click="openConfirmModal(invoice.id)"
            >
              Marcar como Pagado/Entregado
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>Total Ventas Domicilio:</strong></td>
          <td colspan="5">{{ totalDeliverySales }}</td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Modal para ver la factura -->
    <div
      class="modal fade"
      id="invoiceModal"
      tabindex="-1"
      aria-labelledby="invoiceModalLabel"
      aria-hidden="true"
      ref="invoiceModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="invoiceModalLabel">
              Factura: {{ selectedInvoice.invoiceNumber || selectedInvoice.id }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <!-- Se reutiliza InvoiceTemplate para mostrar el detalle completo -->
            <InvoiceTemplate
              v-if="businessInfo"
              :businessInfo="businessInfo"
              :invoiceNumber="selectedInvoice.invoiceNumber ? Number(selectedInvoice.invoiceNumber) : 0"
              :invoiceDate="formatDate(selectedInvoice.createdAt)"
              :paymentMethod="selectedInvoice.paymentMethod || ''"
              :sellerName="selectedInvoice.sellerName || ''"
              :dueDate="selectedInvoice.dueDate || ''"
              :customer="selectedInvoice.customer || {}"
              :cart="selectedInvoice.cart || []"
              :subtotal="selectedInvoice.subtotal || 0"
              :tax="selectedInvoice.tax || 0"
              :total="selectedInvoice.total || 0"
              :deliveryInfo="selectedInvoice.deliveryInfo || {}"
              :products="products"
            />
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              @click="closeModal"
            >
              Cerrar
            </button>
            <button type="button" class="btn btn-primary" @click="printInvoice">
              Imprimir Factura
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal para confirmar entrega y/o registrar pago en domicilio -->
    <div
      class="modal fade"
      id="confirmDeliveryModal"
      tabindex="-1"
      aria-labelledby="confirmDeliveryModalLabel"
      aria-hidden="true"
      ref="confirmDeliveryModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="confirmDeliveryModalLabel">Confirmar Entrega</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              @click="closeConfirmModal"
            ></button>
          </div>
          <div class="modal-body">
            <!-- Si la factura ya está pagada, solo confirmar entrega -->
            <div v-if="selectedInvoice.paymentStatus">
              <p>La factura ya está pagada. Confirme la entrega del pedido.</p>
            </div>
            <!-- Si no está pagada, mostrar opciones para registrar pago -->
            <div v-else>
              <p>La factura no está pagada. Seleccione el medio de pago recibido:</p>
              <div>
                <input type="radio" id="efectivo" value="cash" v-model="deliveryPaymentMethod" />
                <label for="efectivo">Efectivo</label>
              </div>
              <div>
                <input type="radio" id="qr" value="qr" v-model="deliveryPaymentMethod" />
                <label for="qr">QR / Transferencia</label>
              </div>
              <div v-if="deliveryPaymentMethod === 'cash'" class="mt-2">
                <label>Monto recibido:</label>
                <input type="number" v-model.number="deliveryCashReceived" class="form-control" />
              </div>
              <div v-if="deliveryPaymentMethod === 'qr'" class="mt-2">
                <label>Adjuntar comprobante:</label>
                <input type="file" @change="handleDeliveryFileUpload" class="form-control" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeConfirmModal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="confirmDelivery">
              Confirmar Entrega
            </button>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import InvoiceTemplate from '../components/InvoiceTemplate.vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'DomicilioOperativo',
  components: { InvoiceTemplate },
  setup() {
    const route = useRoute()
    const turnId = route.params.turnId
    const invoices = ref([])
    const selectedInvoice = ref({})
    const businessId = localStorage.getItem('businessId') || ''
    
    // Variables para el modal de confirmación de entrega
    const confirmDeliveryModal = ref(null)
    const deliveryPaymentMethod = ref('')
    const deliveryCashReceived = ref(0)
    const deliveryVoucherFile = ref(null)
    
    function handleDeliveryFileUpload(event) {
      deliveryVoucherFile.value = event.target.files[0]
    }
    
    async function openConfirmModal(invoiceId) {
      selectedInvoice.value = invoices.value.find(inv => inv.id === invoiceId)
      // Inicializar variables del modal
      deliveryPaymentMethod.value = ''
      deliveryCashReceived.value = 0
      deliveryVoucherFile.value = null
      confirmDeliveryModal.value = new bootstrap.Modal(document.getElementById('confirmDeliveryModal'))
      confirmDeliveryModal.value.show()
    }
    
    function closeConfirmModal() {
      if (confirmDeliveryModal.value) {
        confirmDeliveryModal.value.hide()
      }
    }
    
    async function confirmDelivery() {
      try {
        if (!selectedInvoice.value.id) {
          throw new Error("Factura no seleccionada");
        }
        const invoiceDoc = doc(db, 'businesses', businessId, 'invoices', selectedInvoice.value.id);
        const updateData = { status: 'delivered' };
        // Si la factura aún no está pagada, se registran los datos del pago:
        if (!selectedInvoice.value.paymentStatus) {
          if (!deliveryPaymentMethod.value) {
            alert("Seleccione un medio de pago");
            return;
          }
          updateData.paymentMethod = deliveryPaymentMethod.value;
          if (deliveryPaymentMethod.value === 'cash') {
            updateData.cashReceived = deliveryCashReceived.value;
          } else if (deliveryPaymentMethod.value === 'qr') {
            if (deliveryVoucherFile.value) {
              updateData.voucherFile = deliveryVoucherFile.value.name;
            }
          }
          updateData.paymentStatus = true;
        }
        // Actualiza el documento sin removerlo
        await updateDoc(invoiceDoc, updateData);
        closeConfirmModal();
        await fetchInvoices();
        alert('Entrega confirmada y factura actualizada.');
      } catch (error) {
        console.error("Error en confirmDelivery:", error);
        alert("Error al confirmar la entrega: " + error.message);
      }
    }
    
    // Definir ref para productos
    const products = ref([])
    const fetchProducts = async () => {
      const productsCol = collection(db, 'businesses', businessId, 'products')
      const snap = await getDocs(productsCol)
      products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
    
    // Función para formatear fecha
    const formatDate = (timestamp) => {
      if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString()
      }
      return ''
    }
    
    // Función para obtener facturas de domicilios
    const fetchInvoices = async () => {
      const invoicesCol = collection(db, 'businesses', businessId, 'invoices')
      const currentTurnId = localStorage.getItem('currentTurnId') || ''
      // Se filtran las facturas de pedidos a domicilio del turno actual
      const q = query(
        invoicesCol,
        where('orderType', '==', 'delivery'),
        where('turnId', '==', currentTurnId)
      )
      const snap = await getDocs(q)
      invoices.value = snap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          paymentMethodDisplay:
            data.paymentMethod === 'cash'
              ? 'Efectivo'
              : data.paymentMethod === 'qr'
              ? 'QR / Transferencia'
              : 'Domicilio'
        }
      })
    }

    
    onMounted(async () => {
      await fetchProducts();
      await fetchInvoices();
    });
    
    // Computed para ordenar y filtrar facturas (si los usas)
    const filterPaymentMethod = ref('');
    const filterSaleType = ref('');
    const sortBy = ref('invoiceNumber');
    const sortOrder = ref('desc');
    
    const sortedAndFilteredInvoices = computed(() => {
      let filtered = invoices.value.slice();
      if (filterPaymentMethod.value) {
        filtered = filtered.filter(inv => inv.paymentMethod === filterPaymentMethod.value);
      }
      if (filterSaleType.value) {
        filtered = filtered.filter(inv => inv.saleType === filterSaleType.value);
      }
      filtered.sort((a, b) => {
        let fieldA = a[sortBy.value];
        let fieldB = b[sortBy.value];
        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return sortOrder.value === 'asc' ? fieldA - fieldB : fieldB - fieldA;
        }
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortOrder.value === 'asc'
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }
        return 0;
      });
      return filtered;
    });
    
    // Totales por tipo de venta
    const totalDirectSales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod !== 'delivery')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    });
    
    const totalDeliverySales = computed(() => {
      return invoices.value
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    });
    
    const totalCashSales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod === 'cash')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    });
    
    const totalQRSales = computed(() => {
      return invoices.value
        .filter(inv => inv.paymentMethod === 'qr')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    });
    
    const totalGeneralSales = computed(() => totalDirectSales.value + totalDeliverySales.value);
    
    // Función para ordenar al hacer clic en encabezados
    const sort = (column) => {
      if (sortBy.value === column) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy.value = column;
        sortOrder.value = 'asc';
      }
    };
    
    // Funciones para el modal de factura
    const invoiceModal = ref(null);
    const viewInvoice = (invoice) => {
      selectedInvoice.value = invoice;
      invoiceModal.value = new bootstrap.Modal(document.getElementById('invoiceModal'));
      invoiceModal.value.show();
    };
    
    const closeModal = () => {
      if (invoiceModal.value) {
        invoiceModal.value.hide();
      }
    };
    
    const printInvoice = () => {
      window.print();
    };
    
    // Obtener businessInfo desde Pinia
    const authStore = useAuthStore();
    const businessInfo = computed(() => authStore.businessInfo);
    
    return {
      turnId: route.params.turnId,
      invoices,
      selectedInvoice,
      products,
      totalDirectSales,
      totalDeliverySales,
      totalCashSales,
      totalQRSales,
      totalGeneralSales,
      viewInvoice,
      printInvoice,
      filterPaymentMethod,
      filterSaleType,
      sortedAndFilteredInvoices,
      sort,
      sortBy,
      sortOrder,
      formatDate,
      closeModal,
      businessInfo,
      openConfirmModal,
      closeConfirmModal,
      confirmDelivery,
      handleDeliveryFileUpload,
      deliveryPaymentMethod,
      deliveryCashReceived
    };
  }
}
</script>

<style scoped>
/* Puedes agregar estilos personalizados aquí */
</style>
