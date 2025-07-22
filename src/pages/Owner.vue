<template>
    <div class="container mt-5">
      <h2>Dashboard Propietario</h2>
      <div class="row">
        <div v-if="loading" class="text-center">
          <p>Cargando negocios...</p>
        </div>
        <div v-else>
          <div v-if="branches.length === 0" class="alert alert-info">
            No se encontraron negocios asociados a su cuenta.
          </div>
          <div class="row">
            <!-- Cards para cada sucursal -->
            <div class="col-md-4 mb-3" v-for="branch in branches" :key="branch.id">
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">{{ branch.name }}</h5>
                  <p class="card-text">
                    <strong>Dirección:</strong> {{ branch.address }}<br>
                    <strong>Ventas Hoy:</strong>
                    <span v-if="branch.todaySales !== undefined">
                      {{ formatCurrency(branch.todaySales) }}
                    </span>
                    <span v-else>-</span>
                    <br>
                    <!-- Mostrar desglose por método de pago -->
                    <div v-if="branch.paymentSums">
                      <template v-for="(sum, method) in branch.paymentSums" :key="method">
                        <strong>{{ method }}:</strong> {{ formatCurrency(sum) }}<br>
                      </template>
                    </div>
                  </p>
                  <router-link :to="`/owner/branch/${branch.id}`" class="btn btn-primary btn-sm">
                    Ver Detalles
                  </router-link>
                </div>
              </div>
            </div>
          </div>
          <!-- Sección de Resumen Consolidado -->
          <div class="mt-4">
            <h4>Resumen Consolidado</h4>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Total Ventas Hoy:</strong> {{ formatCurrency(totalSales) }}</p>
              </div>
              <div class="col-md-6" v-if="consolidatedPayments">
                <p><strong>Ventas por Método:</strong></p>
                <ul>
                  <li v-for="(sum, method) in consolidatedPayments" :key="method">
                    {{ method }}: {{ formatCurrency(sum) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { collection, query, where, getDocs } from 'firebase/firestore'
  import { db, auth } from '../firebase'
  
  // Función auxiliar para obtener inicio y fin del día actual
  const getTodayRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { startOfDay, endOfDay };
  };
  
  export default {
    name: 'Owner',
    setup() {
      const loading = ref(true)
      const branches = ref([])
  
      // UID del owner (suponiendo que ya está autenticado)
      const currentOwnerId = auth.currentUser ? auth.currentUser.uid : ''
  
      // Función para calcular ventas del día y agrupar por método de pago para una sucursal
      const calculateTodaySalesForBranch = async (branchId) => {
        const { startOfDay, endOfDay } = getTodayRange();
        const invoicesRef = collection(db, 'businesses', branchId, 'invoices');
        const q = query(invoicesRef,
          where('createdAt', '>=', startOfDay),
          where('createdAt', '<', endOfDay)
        );
        const snapshot = await getDocs(q);
        let totalSales = 0;
        let paymentSums = {}; // Ejemplo: { cash: 100000, qr: 50000, transferencia: 0 }
        snapshot.forEach(doc => {
          const data = doc.data();
          const total = data.total || 0;
          totalSales += total;
          const method = data.paymentMethod || 'otros';
          if (!paymentSums[method]) {
            paymentSums[method] = 0;
          }
          paymentSums[method] += total;
        });
        return { total: totalSales, paymentSums };
      };
  
      // Función para cargar sucursales (negocios) asociadas al owner y calcular ventas hoy
      const fetchBranches = async () => {
        const branchesRef = collection(db, 'businesses');
        const q = query(branchesRef, where('ownerId', '==', currentOwnerId));
        const snapshot = await getDocs(q);
        const branchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Para cada sucursal, calcular ventas hoy y agrupar por método
        for (const branch of branchesData) {
          const result = await calculateTodaySalesForBranch(branch.id);
          branch.todaySales = result.total;
          branch.paymentSums = result.paymentSums;
        }
        branches.value = branchesData;
        loading.value = false;
      };
  
      // Consolidar los totales por método de pago de todas las sucursales
      const consolidatedPayments = computed(() => {
        const sums = {};
        branches.value.forEach(branch => {
          if (branch.paymentSums) {
            for (const [method, value] of Object.entries(branch.paymentSums)) {
              if (!sums[method]) {
                sums[method] = 0;
              }
              sums[method] += value;
            }
          }
        });
        return sums;
      });
  
      // Total consolidado de ventas hoy (suma de todas las sucursales)
      const totalSales = computed(() => {
        return branches.value.reduce((acc, branch) => acc + (branch.todaySales || 0), 0);
      });
  
      // Función para formatear moneda sin decimales
      const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0
        }).format(value);
      };
  
      onMounted(() => {
        fetchBranches();
      });
  
      return {
        loading,
        branches,
        totalSales,
        consolidatedPayments,
        formatCurrency
      }
    }
  }
  </script>
  
  <style scoped>
  .card {
    margin-bottom: 1rem;
  }
  </style>
  