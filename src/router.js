import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

// Importar páginas Superadmin
import CreateBusiness from './pages/CreateBusiness.vue'
import QrManagement from './pages/QrManagement.vue'

// Importar páginas Admin
import Login from './pages/Login.vue'
import AdminDashboard from './pages/AdminDashboard.vue'
import Products from './pages/Products.vue'
import TurnList from './pages/AdminTurnList.vue'
import TurnDetail from './pages/TurnDetail.vue'
import Expenses from './pages/Expenses.vue'
import ExpensesOpen from './pages/ExpensesOpen.vue'
import Reports from './pages/Reports.vue'
import RegisterUser from './pages/RegisterUser.vue'
import Domicilio from './pages/Domicilio.vue'
import OperativeDashboard from './pages/OperativeDashboard.vue'
import SalesPOS from './pages/SalesPOS.vue'
import TurnManager from './pages/TurnManager.vue'
import DomicilioOperativo from './pages/DomicilioOperativo.vue'
import TurnSalesSummary from './pages/TurnSalesSummary.vue'
import ComboManager from './components/ComboManager.vue'
import ContactsManager from './components/ContactsManager.vue'
import PrintInvoice from './pages/PrintInvoice.vue'
import LibroDiario from './pages/LibroDiario.vue'
import HistoricoLibroDiario from './pages/PastLedgers.vue'
import AdminSettings from './pages/AdminSettings.vue'
import OperativeExpenses from './pages/OperativeExpenses.vue'
import Owner from './pages/Owner.vue'
import BusinessOrders from './pages/BusinessOrders.vue' 
import IncomeOpen from './pages/IncomeOpen.vue'
import AdminStatsView from './manillas/StatsView.vue'

// import paginas manillas
import Manillas from './manillas/Manilla.vue'

// Importar páginas Inventario
import FirestoreView from './inventario/FirestoreView.vue'
import SingleRFID from './inventario/SingleRFID.vue' // No esta en uso
import AllRFID from './inventario/AllRFID.vue' 
import Bodegas from './inventario/ManageBodegas.vue'
import ManageActivos from './inventario/ManageActivos.vue'
import RFIDReaderView from './inventario/RFIDReaderView.vue'

const routes = [
  { path: '/', redirect: '/login' }, // Redirigir a la ruta de inicio
  { path: '/login', name: 'Login', component: Login },
  // Rutas para Superadmin
  {
    path: '/superadmin/create-business', // Nueva ruta para Crear un Nuevo Negocio
    name: 'CreateBusiness',
    component: CreateBusiness,
    meta: { requiresAuth: true, role: 'superadmin' }
  },
  {
    path: '/superadmin/qr-management', // Nueva ruta para QrManagement
    name: 'QrManagement',
    component: QrManagement,
    meta: { requiresAuth: true, role: 'superadmin' }
  },
    // Rutas para Owner
    {
      path: '/owner/owner', // Nueva ruta para Crear un Nuevo Negocio
      name: 'Owner',
      component: Owner,
      meta: { requiresAuth: true, role: 'owner' }
    },
  // Rutas para Admin
  {
    path: '/admin', // Panel de Administración no se usa
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/products', // Gestión de Productos
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/turns',  // Gestión de Turnos SE DEBE MODIFICAR
    name: 'TurnList',
    component: TurnList,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/turns/:id',
    name: 'TurnDetail',
    component: TurnDetail,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/expenses', // Gestión de Gastos SE DEBE ARREGLAR
    name: 'Expenses',
    component: Expenses,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/expensesOpen', // Gestión de Gastos SE DEBE ARREGLAR
    name: 'ExpensesOpen',
    component: ExpensesOpen,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/incomeOpen', // Gestión de Gastos SE DEBE ARREGLAR
    name: 'IncomeOpen',
    component: IncomeOpen,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/reports', // Gestión de Reportes
    name: 'Reports',
    component: Reports,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/register-user', // Gestión de Usuarios
    name: 'RegisterUser',
    component: RegisterUser,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/domicilio',   // Nueva ruta para Domicilio SE DEBE MODIFICAR
    name: 'Domicilio',
    component: Domicilio,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/combos',   // Nueva ruta para ComboManager
    name: 'ComboManager',
    component: ComboManager,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/contacts',   // Nueva ruta para Contacts
    name: 'ContactsManager1',
    component: ContactsManager,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/turn-sales-summary/:turnId',
    name: 'AdminTurnSalesSummary',
    component: TurnSalesSummary,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/libro-diario',
    name: 'LibroDiario',
    component: LibroDiario,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/historico-libro-diario',
    name: 'HistoricoLibroDiario',
    component: HistoricoLibroDiario,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/ledger/:ledgerId',
    name: 'AdminLedgerDetail',
    component: () => import('./pages/AdminLedgerDetail.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/adminSettings',
    name: 'AdminSettings',
    component: AdminSettings,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/statsView',
    name: 'AdminStatsView',
    component: AdminStatsView,
    meta: { requiresAuth: true, role: 'admin' }
  },
  // Rutas para Operativos
  {
    path: '/operative', // este dashboard esta deshabilitado
    name: 'OperativeDashboard',
    component: OperativeDashboard,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/BusinessOrders', // este dashboard esta deshabilitado
    name: 'BusinessOrders',
    component: BusinessOrders,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/pos', // Nueva ruta para SalesPOS
    name: 'SalesPOS',
    component: SalesPOS,
    props: () => ({ businessId: localStorage.getItem('businessId') || '' }),
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/turn', // Abrir y Cerrar Turno
    name: 'TurnManager',
    component: TurnManager,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/domicilio', // Nueva ruta para DomicilioOperativo
    name: 'DomicilioOperativo',
    component: DomicilioOperativo,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/gastos', // Nueva ruta para registrar gastos
    name: 'OperativeExpenses',
    component: OperativeExpenses,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/turn-sales-summary/:turnId', // Resumen de Ventas del Turno
    name: 'OperativeTurnSalesSummary',
    component: TurnSalesSummary,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/operative/contacts',   // Nueva ruta para ContactsManager
    name: 'ContactsManager',
    component: ContactsManager,
    meta: { requiresAuth: true, role: 'operative' }
  },
  {
    path: '/print-invoice', // Nueva ruta para imprimir la factura
    name: 'PrintInvoice',
    component: PrintInvoice
  },
  // Rutas para Manillas
  {
    path: '/manillas/manillas', // Nueva ruta para imprimir la factura
    name: 'Manillas',
    component: Manillas
  },
  // Rutas para Inventario
  { path: '/inventario/inicio', name: 'Firestore', component: FirestoreView, meta: { requiresAuth: true, role: 'Inventario'} },
  //{ path: '/inventario/single', name: 'SingleRFID', component: SingleRFID, meta: { requiresAuth: true, role: 'Inventario'} },
  { path: '/inventario/all', name: 'AllRFID', component: AllRFID, meta: { requiresAuth: true, role: 'Inventario'} },
  { path: '/inventario/bodegas', name: 'Bodegas', component: Bodegas, meta: { requiresAuth: true, role: 'Inventario'} },
  { path: '/inventario/IngresarActivos', name: 'IngresarActivos', component: ManageActivos, meta: { requiresAuth: true, role: 'Inventario'} },
  { path: '/inventario/verActivo', name: 'VerActivo', component: RFIDReaderView, meta: { requiresAuth: false, role: 'Inventario'} },
  {
    path: '/fijos/crear',
    name: 'CrearFijo',
    component: () => import('./inventario/fijos/FijosCrearActivoView.vue'),
    meta: { requiresAuth: true, role: 'Inventario' }
  },

  //-----agregado por david 

  {
  path: '/fijos/listado',
  name: 'ListadoFijos',
  component: () => import('./inventario/fijos/FijosCrearActivoView.vue'),
  meta: { requiresAuth: true, role: 'Inventario' }
},
 //

 

  {
    path: '/prestamo/categorias',
    name: 'PrestamoCategorias',
    component: () => import('./inventario/prestamo/PrestamoCategoriasView.vue'),
    meta: { requiresAuth: true, role: 'Inventario' }
  },
  {
    path: '/prestamo/crear-activo-movil',
    name: 'CrearActivoMovil',
    component: () => import('./inventario/prestamo/PrestamoCrearActivoView.vue'),
    meta: { requiresAuth: true, role: 'Inventario' }
  },
  {
    path: '/prestamo/activos-asignados',
    name: 'ActivosAsignados',
    component: () => import('./inventario/prestamo/PrestamoActivosAsignados.vue'),
    meta: { requiresAuth: true, role: 'Inventario' }
  },
  {
    path: '/prestamo/ordenes-de-pedido',
    name: 'OrdenesDePedido',
    component: () => import('./inventario/prestamo/OrderManagementView.vue'),
    meta: { requiresAuth: true, role: 'Inventario' }
  },
]

// ... El resto del código del router (onAuthStateChanged, etc.)


const router = createRouter({
    history: createWebHistory(),
    routes
  })
  
  router.beforeEach((to, from, next) => {
    if (!to.meta.requiresAuth) return next()
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      if (!user) {
        next('/login')
      } else {
        const userRole = localStorage.getItem('userRole')
        if (to.meta.role && to.meta.role !== userRole) next('/login')
        else next()
      }
    })
  })

export default router
