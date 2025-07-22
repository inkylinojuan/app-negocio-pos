<template>
  <div class="container mt-5">
    <h2>Configuración del Sistema</h2>
    <!-- Pestañas de navegación -->
    <ul class="nav nav-tabs" role="tablist">
      <!-- Nueva pestaña para la configuración del turno -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          data-bs-toggle="tab"
          data-bs-target="#turnoConfig"
          type="button"
          role="tab"
        >
          Configuración del Sistema
        </button>
      </li>
      <!-- Pestaña 2: Configuración Básica -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          data-bs-target="#basicConfig"
          type="button"
          role="tab"
        >
          Configuración Básica
        </button>
      </li>
      <!-- Pestaña 3: Conexión Allegra -->
      <!--<li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          data-bs-target="#alegraConfig"
          type="button"
          role="tab"
        >
          Conexión Allegra
        </button>
      </li>-->
      <!-- Pestaña 4: Conexión Wompi -->
      <!--<li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          data-bs-target="#wompiConfig"
          type="button"
          role="tab"
        >
          Conexión Wompi
        </button>
      </li>-->
      <!--<li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          data-bs-target="#qrConfig"
          type="button"
          role="tab"
        >
          Códigos QR
        </button>
      </li>-->
    </ul>

    <!-- Contenido de las pestañas -->
    <div class="tab-content mt-3">
      <!-- Nueva Pestaña 1: Configuración del Turno -->
      <div class="tab-pane fade show active" id="turnoConfig" role="tabpanel">
        <form @submit.prevent="saveTurnoConfig">
          <div class="mb-3 select-group">
            <label class="form-label">Tipo de Turno</label>
            <select v-model="turnoConfig.tipo" class="form-select" required>
              <option value="">Seleccione un tipo de turno</option>
              <option value="unicoConInventario">Turno Único con Inventario</option>
              <option value="unicoSinInventario">Turno Único sin Inventario</option>
              <option value="variadoSinInventario">Turno Variado sin Inventario</option>
            </select>
          </div>
              <!-- Nuevo select para tipo de gasto -->
            <div class="mb-3">
              <label class="form-label">Tipo de Gasto</label>
              <select v-model="turnoConfig.tipoGasto" class="form-select" required>
                <option value="">Seleccione un tipo de gasto</option>
                <option value="gastoConInventario">Registrar Gasto con Inventario</option>
                <option value="gastoAbierto">Registrar Gasto Abierto</option>
              </select>
            </div>
          <button type="submit" class="btn btn-primary">
            Guardar Configuración del Turno
          </button>
        </form>
      </div>
      
      <!-- Pestaña 2: Configuración Básica -->
      <div class="tab-pane fade" id="basicConfig" role="tabpanel">
        <form @submit.prevent="saveBasicConfig">
          <div class="mb-3">
            <label class="form-label">Nombre del Negocio</label>
            <input v-model="basicConfig.name" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Nombre Persona</label>
            <input v-model="basicConfig.person" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción</label>
            <textarea v-model="basicConfig.description" class="form-control" required></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Dirección</label>
            <input v-model="basicConfig.address" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">NIT</label>
            <input v-model="basicConfig.nit" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Teléfono</label>
            <input v-model="basicConfig.phone" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Correo Electrónico</label>
            <input v-model="basicConfig.email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Régimen Tributario</label>
            <input v-model="basicConfig.taxRegime" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Pie de Factura</label>
            <textarea
              v-model="basicConfig.invoiceFooter"
              class="form-control"
              placeholder="Información de jurisdicción, notas, etc."
              required
            ></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Facturador</label>
            <input v-model="basicConfig.facturador" type="text" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary">
            Guardar Configuración Básica
          </button>
        </form>
      </div>
      
      <!-- Pestaña 3: Conexión Allegra -->
      <div class="tab-pane fade" id="alegraConfig" role="tabpanel">
        <form @submit.prevent="saveAlegraConfig">
          <div class="mb-3">
            <label class="form-label">Usuario Allegra</label>
            <input v-model="alegraConfig.usuario" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Token Allegra</label>
            <input v-model="alegraConfig.token" type="text" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary">
            Guardar Conexión Allegra
          </button>
        </form>
      </div>
      
      <!-- Pestaña 4: Conexión Wompi -->
      <div class="tab-pane fade" id="wompiConfig" role="tabpanel">
        <form @submit.prevent="saveWompiConfig">
          <div class="mb-3">
            <label class="form-label">Public Key</label>
            <input v-model="wompiConfig.publicKey" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Private Key</label>
            <input v-model="wompiConfig.privateKey" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Event Key</label>
            <input v-model="wompiConfig.eventKey" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Integrity Key</label>
            <input v-model="wompiConfig.integrityKey" type="text" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary">
            Guardar Conexión Wompi
          </button>
        </form>
      </div>

    <!-- Pestaña 5: QR Codes -->
    <div class="tab-pane fade" id="qrConfig" role="tabpanel">

    <!-- Siempre visible: URL base + botón Generar -->
    <div class="d-flex mb-3">
      <input
        v-model="qrConfig.baseUrl"
        type="text"
        class="form-control"
        placeholder="https://clasealpha.com/index.php?UID="
      />
      <button class="btn btn-success ms-2" @click="promptAndGenerate">
        Generar Códigos UID
      </button>
    </div>

    <!-- Mensaje si no hay códigos -->
    <p v-if="!CodigoBoleta.length" class="text-muted">
      No hay códigos generados todavía.
    </p>

    <!-- Tabla de códigos -->
    <table v-else class="table table-striped">
      <thead>
        <tr>
          <th>#</th><th>UID</th><th>UHF</th><th>NFC</th><th>QR</th><th>Nombre</th><th>Documento</th>
          <th>Email</th><th>Teléfono</th><th>Estado</th><th>Descarga</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="code in CodigoBoleta" :key="code.id">
          <td>{{ code.codeNumber }}</td>
          <td>{{ code.uid }}</td>
          <td><input v-model="code.UHFid" @blur="updateCode(code)" class="form-control form-control-sm"/></td>
          <td><input v-model="code.NFCid" @blur="updateCode(code)" class="form-control form-control-sm"/></td>
          <td><img :src="code.qrDataUrl" width="80" /></td>
          <td><input v-model="code.nombre" @blur="updateCode(code)" class="form-control form-control-sm"/></td>
          <td><input v-model="code.documento" @blur="updateCode(code)" class="form-control form-control-sm"/></td>
          <td><input v-model="code.email" @blur="updateCode(code)" class="form-control form-control-sm"/></td>
          <td><input v-model="code.telefono" @blur="updateCode(code)" class="form-control form-control-sm"/></td>
          <td>
            <select v-model="code.status" @change="updateCode(code)" class="form-select form-select-sm">
              <option value="disponible">Disponible</option>
              <option value="asignado">Asignado</option>
            </select>
          </td>
          <td>
            <a :href="code.qrDataUrl" :download="`${code.codeNumber}.png`" class="btn btn-outline-secondary btn-sm">
              PNG
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    </div>


    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { doc, getDoc, setDoc, getDocs, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import QRCode from 'qrcode'

export default {
  name: 'AdminSettings',
  setup() {
    const businessId = localStorage.getItem('businessId') || ''
    const businessDocRef = doc(db, 'businesses', businessId)
    
    // Configuración del turno (nuevo)
    const turnoConfig = ref({
      tipo: '',
      tipoGasto: '' // Nuevo campo
    });
    
    // Configuración Básica
    const basicConfig = ref({
      name: '',
      person: '',
      description: '',
      address: '',
      nit: '',
      phone: '',
      email: '',
      taxRegime: '',
      invoiceFooter: '',
      facturador: ''
    });
    
    // Configuración de Allegra
    const alegraConfig = ref({
      usuario: '',
      token: ''
    });
    
    // Configuración de Wompi
    const wompiConfig = ref({
      publicKey: '',
      privateKey: '',
      eventKey: '',
      integrityKey: ''
    });
    // --- Config para QR ---
    const qrConfig = ref({
      baseUrl: ''
    })
    const CodigoBoleta = ref([])
    const qrCollectionRef = ( ) => collection(businessDocRef, 'CodigoBoleta')

    // 1) Carga de códigos desde Firestore
    const fetchCodigoBoleta = async () => {
      const snap = await getDocs(qrCollectionRef())
      CodigoBoleta.value = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      await generateImages()
    }

    // 2) Generación masiva de UIDs
    const promptAndGenerate = async () => {
      if (!qrConfig.value.baseUrl) {
        alert('Por favor ingresa la URL base antes de generar.')
        return
      }
      const cnt = parseInt(prompt('¿Cuántos códigos UID generar?'), 10)
      if (!cnt || cnt <= 0) return
      for (let i = 0; i < cnt; i++) {
        const uid = crypto.randomUUID()
        const codeNumber = String(CodigoBoleta.value.length + i + 1).padStart(5, '0')
        await addDoc(qrCollectionRef(), {
          uid,
          UHFid: '',
          NFCid: '',
          codeNumber,
          status: 'disponible',
          assigned: false,
          businessId,
          userId: '',
          baseUrl: qrConfig.value.baseUrl,  // ← guardamos la baseUrl aquí
          nombre: '',
          documento: '',
          email: '',
          telefono: ''
        })
      }
      await fetchCodigoBoleta()
    }

    // 3) Generar imágenes QR (dataURLs)
    const generateImages = async () => {
      for (const code of CodigoBoleta.value) {
        const fullUrl = `${code.baseUrl}${code.uid}`    // ← usa code.baseUrl
        code.qrDataUrl = await QRCode.toDataURL(fullUrl, { width: 200 })
      }
    }

    // 4) Actualizar un registro al editarlo
    const updateCode = async (code) => {
      const docRef = doc(businessDocRef, 'CodigoBoleta', code.id)
      try {
        await updateDoc(docRef, {
          nombre: code.nombre,
          documento: code.documento,
          email: code.email,
          telefono: code.telefono,
          status: code.status,
          assigned: false,                
          businessId,                     
          userId: '',    
        })
      } catch (err) {
        console.error('Error actualizando código:', err)
      }
    }
    
    // Función para cargar la configuración del negocio
    const fetchConfig = async () => {
      const docSnap = await getDoc(businessDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Configuración del turno
        turnoConfig.value = data.turnoConfig || { 
          tipo: '', 
          tipoGasto: '' 
        };        
    // Configuración básica
        basicConfig.value = {
          name: data.name || '',
          person: data.person || '',
          description: data.description || '',
          address: data.address || '',
          nit: data.nit || '',
          phone: data.phone || '',
          email: data.email || '',
          taxRegime: data.taxRegime || '',
          invoiceFooter: data.invoiceFooter || '',
          facturador: data.facturador || ''
        };
        // Configuración Allegra
        alegraConfig.value = data.alegraConfig || { usuario: '', token: '' };
        // Configuración Wompi
        wompiConfig.value = data.wompiConfig || { publicKey: '', privateKey: '', eventKey: '', integrityKey: '' };
      }
    };
    
    // Funciones para guardar la configuración. Se usa setDoc con merge:true para actualizar sin sobrescribir.
    const saveTurnoConfig = async () => {
      // Validación de valores permitidos
      const tiposGastoValidos = ['gastoConInventario', 'gastoAbierto'];
      if (!tiposGastoValidos.includes(turnoConfig.value.tipoGasto)) {
        alert("Seleccione un tipo de gasto válido");
        return;
      }

      try {
        await setDoc(businessDocRef, { turnoConfig: turnoConfig.value }, { merge: true });
        alert("Configuración del Turno actualizada.");
      } catch (error) {
        alert("Error al guardar la configuración del turno: " + error.message);
      }
    };

    const saveBasicConfig = async () => {
      try {
        await setDoc(businessDocRef, basicConfig.value, { merge: true });
        alert("Configuración Básica actualizada.");
      } catch (error) {
        alert("Error al guardar la configuración básica: " + error.message);
      }
    };
    
    const saveAlegraConfig = async () => {
      try {
        await setDoc(businessDocRef, { alegraConfig: alegraConfig.value }, { merge: true });
        alert("Configuración de Allegra actualizada.");
      } catch (error) {
        alert("Error al guardar la configuración de Allegra: " + error.message);
      }
    };
    
    const saveWompiConfig = async () => {
      try {
        await setDoc(businessDocRef, { wompiConfig: wompiConfig.value }, { merge: true });
        alert("Configuración de Wompi actualizada.");
      } catch (error) {
        alert("Error al guardar la configuración de Wompi: " + error.message);
      }
    };
    
    onMounted(() => {
      fetchConfig();
      fetchCodigoBoleta()   // nueva carga
    });
    
    return { 
      turnoConfig,
      basicConfig, 
      alegraConfig, 
      wompiConfig, 
      saveTurnoConfig,
      saveBasicConfig, 
      saveAlegraConfig, 
      saveWompiConfig,
      qrConfig,
      CodigoBoleta,
      promptAndGenerate,
      updateCode
    };
  }
}
</script>

<style scoped>
.mb-3.select-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}
.qr-scanner-modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.scanner-container {
  max-width: 400px;
  width: 90%;
}
</style>
