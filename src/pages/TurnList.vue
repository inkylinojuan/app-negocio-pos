<template>
    <div class="container mt-5">
      <h2>Turnos</h2>
      <div class="mb-3">
        <!-- Si el usuario es admin, permite elegir a qué operario asignar el turno -->
        <template v-if="currentUserRole === 'admin'">
          <label for="operativeSelect" class="form-label">Asignar Operario:</label>
          <select id="operativeSelect" v-model="selectedOperative" class="form-select">
            <option value="" disabled>Seleccione un operario</option>
            <option v-for="op in operatives" :key="op.uid" :value="op.uid">
              {{ op.fullName }}
            </option>
          </select>
        </template>
      </div>
      <button class="btn btn-primary mb-3" @click="createTurn">
        Abrir Turno
      </button>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Asignado a</th>
            <th>Fecha Apertura</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="turn in turns" :key="turn.id">
            <td>{{ turn.id }}</td>
            <td>{{ turn.assignedTo }}</td>
            <td>
              {{ turn.openedAt ? new Date(turn.openedAt.seconds * 1000).toLocaleString() : '' }}
            </td>
            <td>{{ turn.status }}</td>
            <td>
              <!-- Si el admin o el operario asignado deben poder ver el detalle -->
              <router-link :to="`/admin/turns/${turn.id}`" class="btn btn-sm btn-info">
                Ver
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { auth, db } from '../firebase'
  import { collection, addDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'TurnList',
    setup() {
      const businessId = localStorage.getItem('businessId') || ''
      const turns = ref([])
      const router = useRouter()
  
      // Se determina el rol y el uid del usuario actual
      const currentUserRole = localStorage.getItem('userRole') || ''
      const currentUserUid = auth.currentUser ? auth.currentUser.uid : ''
  
      // Para admin: obtener la lista de operarios (se asume que hay una colección "users" con campo role)
      const operatives = ref([])
      const selectedOperative = ref('')
      const turnsCol = collection(db, 'businesses', businessId, 'turns')
  
      const fetchOperatives = async () => {
        const usersCol = collection(db, 'users')
        const q = query(usersCol, where('role', '==', 'operative'), where('businessId', '==', businessId))
        const snap = await getDocs(q)
        operatives.value = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
        console.log("Operative Value",operatives.value)
      }
  
      const fetchTurns = async () => {
        const snap = await getDocs(turnsCol)
        turns.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
  
      const createTurn = async () => {
        let assignedTo = ''
        if (currentUserRole === 'operative') {
          // Si es operario, se asigna automáticamente su uid
          assignedTo = currentUserUid
        } else if (currentUserRole === 'admin') {
          // Si es admin, se debe elegir un operario
          if (!selectedOperative.value) {
            alert('Por favor, seleccione un operario para asignar el turno.')
            return
          }
          assignedTo = selectedOperative.value
        }
        const turnData = {
          assignedTo,          // operario al que se asigna el turno
          openedBy: currentUserUid,
          openedAt: serverTimestamp(),
          status: 'open'
          // Puedes agregar más campos, como inventoryInitial, etc.
        }
        const docRef = await addDoc(turnsCol, turnData)
        fetchTurns()
        router.push(`/admin/turns/${docRef.id}`)
      }
  
      onMounted(() => {
        fetchTurns()
        if (currentUserRole === 'admin') {
          fetchOperatives()
        }
      })
  
      return {
        turns,
        createTurn,
        operatives,
        selectedOperative,
        currentUserRole
      }
    }
  }
  </script>
  