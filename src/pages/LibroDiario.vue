<template>
    <div class="container mt-5">
      <h2>Libro Diario</h2>
  
      <!-- Si no hay libro diario abierto, mostrar formulario para abrirlo -->
      <div v-if="!openLedger">
        <!-- <h3>Abrir Libro Diario</h3> -->
        <form @submit.prevent="openLedgerFunction" class="row g-3">
          <div class="col-md-6">
            <label for="openingDate" class="form-label">Fecha de Apertura</label>
            <input id="openingDate" type="date" v-model="openingDate" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label for="initialBalance" class="form-label">Saldo Inicial</label>
            <input id="initialBalance" type="number" v-model.number="initialBalance" class="form-control" required />
          </div>
          <div class="col-12">
            <button type="submit" class="btn btn-primary">Abrir Libro Diario</button>
          </div>
        </form>
      </div>
  
      <!-- Si hay libro diario abierto, mostrar sus datos y el reporte -->
      <div v-else>
        <h3>Libro Diario Abierto</h3>
        <p>
          <strong>ID:</strong> {{ openLedger.id }} <br>
          <strong>Fecha de Apertura:</strong> {{ formatDate(openLedger.openedAt) }} <br>
          <strong>Saldo Inicial:</strong> {{ openLedger.saldoInicial }}
        </p>
        <button class="btn btn-danger mb-3" @click="closeLedger">Cerrar Libro Diario</button>
        
        <LedgerChart 
            :totalIncomes="incomeBar" 
            :totalExpenses="expenseBar" 
            :operationalProfit="profitBar" 
            />
        
        <!-- Tabla de transacciones -->
        <table class="table table-bordered">
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
            <tr v-for="(trans, index) in enrichedTransactions" :key="index">
              <td>{{ formatDate(trans.createdAt) }}</td>
              <td>{{ trans.detail }} <span v-if="trans.paidTo"><br>pagado a: {{ trans.paidTo.name }}</span> <span v-if="trans.folderCode"> carpeta: {{ trans.folderCode }}</span> 
                <br><span v-if="trans.categoryName">Categoría: {{ trans.categoryName }}</span>
                <br><span v-if="trans.expenseTypeName">Tipo: {{ trans.expenseTypeName }}</span>
              </td>
              <td v-if="trans.type==='ingreso'">{{ trans.amount }}</td>
              <td v-else></td>
              <td v-if="trans.type==='egreso'">{{ trans.amount }}</td>
              <td v-else></td>
              <td>{{ runningBalances[index] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { db } from '../firebase'
  import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, serverTimestamp, runTransaction, Timestamp } from 'firebase/firestore'
  import LedgerChart from '../components/LedgerChart.vue'

  // Función auxiliar para formatear fecha
  const formatDate = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString()
    }
    return ''
  }
  
  // Función para formatear la fecha en formato YYYYMMDD (sin guiones)
  const formatDateForId = (dateString) => {
    return dateString.replace(/-/g, '');
  }
  
  export default {
    name: 'LibroDiario',
    components: { LedgerChart },
    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      const openLedger = ref(null)
      const openingDate = ref('')
      const initialBalance = ref(0)
      const currentWeek = ref("2025-W10") // Esto lo calcularías dinámicamente
      const saldoInicial = ref(0)
      const transactions = ref([])

      const categoryMap = ref({})
      const typeMap     = ref({})

      async function loadExpenseCategories() {
        const snap = await getDocs(collection(db, 'businesses', businessId, 'expenseCategories'))
        snap.docs.forEach(d => {
          categoryMap.value[d.id] = d.data().name
        })
      }

      async function loadExpenseTypes() {
        const snap = await getDocs(collection(db, 'businesses', businessId, 'expenseTypes'))
        snap.docs.forEach(d => {
          typeMap.value[d.id] = d.data().name
        })
      }

      // Para controlar el contador, usaremos un documento en: businesses/{businessId}/counters/libroDiario
      const getNextLedgerNumber = async () => {
        const counterDocRef = doc(db, 'businesses', businessId, 'counters', 'libroDiario')
        try {
          const newNumber = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterDocRef)
            let currentCounter = 0
            if (!counterDoc.exists()) {
              transaction.set(counterDocRef, { counter: 1 })
              currentCounter = 1
            } else {
              currentCounter = counterDoc.data().counter
              const nextCounter = currentCounter + 1
              transaction.update(counterDocRef, { counter: nextCounter })
              currentCounter = nextCounter
            }
            return currentCounter
          })
          return newNumber
        } catch (e) {
          console.error("Error al obtener el número del libro diario:", e)
          return 0
        }
      }
      
      // Función para abrir un nuevo libro diario
      const openLedgerFunction = async () => {
        if (!openingDate.value || initialBalance.value <= 0) {
            alert("Ingrese una fecha válida y un saldo inicial mayor que 0");
            return;
        }
        // Obtener el siguiente número del contador
        const nextNumber = await getNextLedgerNumber();
        const formattedNumber = String(nextNumber).padStart(4, '0');
        const formattedDate = formatDateForId(openingDate.value); // ej. "20230515"
        const ledgerId = `${formattedNumber}-LibroDiario-${formattedDate}`;
        
        const ledgerData = {
            saldoInicial: initialBalance.value,
            // Asignamos serverTimestamp para la apertura
            openedAt: serverTimestamp(),
            openDateInput: openingDate.value,
            isOpen: true
        };
        
        const ledgerRef = doc(db, 'businesses', businessId, 'libroDiario', ledgerId);
        await setDoc(ledgerRef, ledgerData);
        // Ahora, obtenemos el documento creado para resolver el timestamp real
        const docSnap = await getDoc(ledgerRef);
        if (docSnap.exists()) {
            openLedger.value = { id: ledgerId, ...docSnap.data() };
            alert("Libro Diario abierto exitosamente.");
            await fetchTransactions();
        } else {
            alert("Error al abrir el Libro Diario");
        }
        };

        // Función para cerrar el libro diario:
        const closeLedger = async () => {
        if (!openLedger.value) return;
        const ledgerRef = doc(db, 'businesses', businessId, 'libroDiario', openLedger.value.id);
        await setDoc(ledgerRef, { closedAt: serverTimestamp(), isOpen: false }, { merge: true });
        openLedger.value = null;
        alert("Libro Diario cerrado.");
        };

        // Para consultar el libro diario abierto:
        const checkOpenLedger = async () => {
            const ledgerCol = collection(db, 'businesses', businessId, 'libroDiario');
            // Usamos isOpen para filtrar
            const q = query(ledgerCol, where('isOpen', '==', true));
            const snap = await getDocs(q);
            if (!snap.empty) {
                openLedger.value = { id: snap.docs[0].id, ...snap.docs[0].data() };
                await fetchTransactions();
            }
            };

      
      // Para consultar transacciones, combinamos ventas (ingresos) y gastos (egresos)
      const fetchTransactions = async () => {
        if (!openLedger.value) return;
        // Si deseas usar un rango de fechas, asegúrate de que openLedger.value.openedAt sea un Timestamp real.
        const startTime = Timestamp.fromDate(new Date(openLedger.value.openDateInput));
        console.log("startTime", startTime)
        const endTime = openLedger.value.closedAt || Timestamp.fromDate(new Date());
        
        // Consulta a ventas (por ejemplo, "invoices")
        const invoicesCol = collection(db, 'businesses', businessId, 'invoices');
            const q1 = query(
            invoicesCol,
            where('createdAt', '>=', startTime),
            where('createdAt', '<=', endTime)  // Asegúrate de que endTime también sea un Timestamp
            );
            const snap1 = await getDocs(q1);
            console.log("snap1", snap1.docs)
            const ingresos = snap1.docs.map(doc => ({
            ...doc.data(),
            type: 'ingreso',
            amount: Number(doc.data().total || 0),
            detail: `Ingreso - ${doc.data().paymentMethod === 'cash' ? 'Efectivo' : (doc.data().paymentMethod === 'qr' ? 'QR/Transferencia' : 'Venta')}`
            }));
        
        // Consulta a gastos
        const expensesCol = collection(db, 'businesses', businessId, 'expenses')
        const q2 = query(expensesCol,
          where('createdAt', '>=', startTime),
          where('createdAt', '<=', endTime)
        );
        const snap2 = await getDocs(q2);
        const egresos = snap2.docs.map(doc => ({
          ...doc.data(),
          type: 'egreso',
          amount: Number(doc.data().total || doc.data().amount || 0),
          detail: `Egreso - ${doc.data().description}`
        }));
        
        transactions.value = ingresos.concat(egresos).sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
      };
      
      // Computed: saldo acumulado (running balance)
      const runningBalances = computed(() => {
        let balances = [];
        let current = openLedger.value ? Number(openLedger.value.saldoInicial) : 0;
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
      
      // Computed: transacciones ordenadas por fecha
      const sortedTransactions = computed(() => {
        return transactions.value.slice().sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
      });
      
      // Totales
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
      
      // Gráficos (barras) simples
      const incomeBar = computed(() => totalIncomes.value / 10);
      const expenseBar = computed(() => totalExpenses.value / 10);
      const profitBar = computed(() => Math.abs(operationalProfit.value) / 10);
      
      // Función para formatear fechas
      const formatDateFn = (timestamp) => {
        if (timestamp && timestamp.seconds) {
          return new Date(timestamp.seconds * 1000).toLocaleString();
        }
        return '';
      };

      const enrichedTransactions = computed(() => {
        return sortedTransactions.value.map(trans => ({
          ...trans,
          categoryName: categoryMap.value[trans.categoryId] || trans.categoryId,
          expenseTypeName: typeMap.value[trans.expenseId]    || trans.expenseId
        }))
      })
      
      // Renombramos para usar en template
      const formatDate = formatDateFn;
      
      onMounted(async () => {
        await Promise.all([
        loadExpenseCategories(),
        loadExpenseTypes()
      ])
        await checkOpenLedger();
      });
      
      return {
        openLedger,
        openingDate,
        initialBalance,
        openLedgerFunction,
        closeLedger,
        transactions,
        sortedTransactions,
        runningBalances,
        totalIncomes,
        totalExpenses,
        operationalProfit,
        incomeBar,
        expenseBar,
        profitBar,
        formatDate,
        // Para el reporte, en el modal se usan las transacciones de ventas y gastos
        fetchTransactions,
        // Propiedades para el modal de domicilios se pueden agregar aquí si se requiere en otra vista.
        currentWeek,
        saldoInicial,
        totalExpenses,
        operationalProfit,
        enrichedTransactions,
        runningBalances,
      };
    }
  };
  </script>
  
  <style scoped>
  .chart {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    max-height: 200px;
    overflow-y: auto;
  }
  .bar {
    flex: 1;
    background-color: #007bff;
    color: #fff;
    text-align: center;
    padding: 0.5rem;
  }
  </style>
  