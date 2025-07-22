<template>
    <div class="container mt-5">
      <h2>Detalle del Libro Diario</h2>
      <div v-if="ledger">
        <p>
          <strong>ID:</strong> {{ ledger.id }}<br>
          <strong>Fecha de Apertura:</strong> {{ formatDate(ledger.openedAt) }}<br>
          <strong>Fecha de Cierre:</strong> {{ ledger.closedAt ? formatDate(ledger.closedAt) : 'Abierto' }}<br>
          <strong>Saldo Inicial:</strong> {{ ledger.saldoInicial }}
        </p>
  
        <!-- Gráfico de resumen usando LedgerChart -->
        <LedgerChart 
          :totalIncomes="totalIncomes" 
          :totalExpenses="totalExpenses" 
          :operationalProfit="operationalProfit" 
        />
  
        <!-- Tabla de transacciones -->
        <table class="table table-bordered mt-4">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Detalle</th>
              <th>Ingreso</th>
              <th>Egreso</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(trans, index) in sortedTransactions" :key="index">
              <td>{{ formatDate(trans.createdAt) }}</td>
              <td>{{ trans.detail }}</td>
              <td v-if="trans.type==='ingreso'">{{ trans.amount }}</td>
              <td v-else></td>
              <td v-if="trans.type==='egreso'">{{ trans.amount }}</td>
              <td v-else></td>
              <td>{{ runningBalances[index] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>Cargando datos...</p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { db } from '../firebase'
  import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
  import { useRoute } from 'vue-router'
  import LedgerChart from '../components/LedgerChart.vue'
  
  const formatDate = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString()
    }
    return ''
  }
  
  export default {
    name: 'AdminLedgerDetail',
    components: { LedgerChart },
    setup() {
      const route = useRoute();
      const ledgerId = route.params.ledgerId;
      const businessId = localStorage.getItem('businessId') || '';
      
      const ledger = ref(null);
      const transactions = ref([]);
      
      // Cargar el libro diario
      const fetchLedger = async () => {
        const ledgerRef = doc(db, 'businesses', businessId, 'libroDiario', ledgerId);
        const ledgerSnap = await getDoc(ledgerRef);
        if (ledgerSnap.exists()) {
          ledger.value = { id: ledgerId, ...ledgerSnap.data() };
        }
      }
      
      // Cargar transacciones (ingresos y egresos) asociadas al libro diario
      const fetchTransactions = async () => {
        if (!ledger.value) return;
        // Se utiliza openDateInput (cadena) para definir el inicio
        const startTime = ledger.value.openDateInput ? new Date(ledger.value.openDateInput) : new Date();
        // Convertir a Timestamp usando el constructor de Date (se asume que las facturas usan Timestamp)
        // Para la fecha final, se usa closedAt si existe, o la fecha actual.
        const endTime = ledger.value.closedAt ? ledger.value.closedAt : new Date();
        
        const invoicesCol = collection(db, 'businesses', businessId, 'invoices');
        const q1 = query(
          invoicesCol,
          where('createdAt', '>=', startTime),
          where('createdAt', '<=', endTime)
        );
        const snap1 = await getDocs(q1);
        const ingresos = snap1.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            type: 'ingreso',
            amount: Number(data.total || 0),
            detail: `Ingreso - ${data.paymentMethod === 'cash' ? 'Efectivo' : (data.paymentMethod === 'qr' ? 'QR/Transferencia' : 'Venta')}`
          }
        });
        
        const expensesCol = collection(db, 'businesses', businessId, 'expenses');
        const q2 = query(
          expensesCol,
          where('createdAt', '>=', startTime),
          where('createdAt', '<=', endTime)
        );
        const snap2 = await getDocs(q2);
        const egresos = snap2.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            type: 'egreso',
            amount: Number(data.total || data.amount || 0),
            detail: `Egreso - ${data.description}`
          }
        });
        
        transactions.value = ingresos.concat(egresos).sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
      }
      
      onMounted(async () => {
        await fetchLedger();
        await fetchTransactions();
      });
      
      const sortedTransactions = computed(() => transactions.value);
      
      const runningBalances = computed(() => {
        let balances = [];
        let current = ledger.value ? Number(ledger.value.saldoInicial) : 0;
        sortedTransactions.value.forEach(trans => {
          if (trans.type === 'ingreso') {
            current += Number(trans.amount);
          } else if (trans.type === 'egreso') {
            current -= Number(trans.amount);
          }
          balances.push(current);
        });
        return balances;
      });
      
      const totalIncomes = computed(() => {
        return sortedTransactions.value
          .filter(t => t.type === 'ingreso')
          .reduce((sum, t) => sum + Number(t.amount), 0);
      });
      const totalExpenses = computed(() => {
        return sortedTransactions.value
          .filter(t => t.type === 'egreso')
          .reduce((sum, t) => sum + Number(t.amount), 0);
      });
      const operationalProfit = computed(() => totalIncomes.value - totalExpenses.value);
      
      return {
        ledger,
        transactions,
        sortedTransactions,
        runningBalances,
        totalIncomes,
        totalExpenses,
        operationalProfit,
        formatDate
      }
    }
  }
  </script>
  
  <style scoped>
  .table {
    margin-top: 1rem;
  }
  </style>
  