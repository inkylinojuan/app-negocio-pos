<template>
    <div class="qr-container">

      <!-- Paso 1: escanear manilla -->
      <div v-if="step === 1">
        <QrStream @decode="onManillaDecode" />
        <p class="text-danger mt-2" v-if="codeError">{{ codeError }}</p>
      </div>
  
      
      <!-- Paso 2: captura RFID y opción preregistro -->
      <div v-else-if="step === 2">
        <div class="mb-3">
          <label class="form-label">RFID de la manilla</label>
          <input
            ref="rfidField"
            v-model="rfidInput"
            type="text"
            class="form-control w-50"
            placeholder="Acerca el tag RFID"
            :disabled="rfidCaptured"
            @input="onRfidInput"
            @keyup.enter.prevent="onRfidComplete"
            />
        </div>
        <button class="btn btn-primary me-2" @click="linkManilla">
          Vincular manilla
        </button>
        <button class="btn btn-secondary" @click="startPreregreScan">
          Ya tengo mi QR preregistrado
        </button>
        <p class="text-danger mt-2" v-if="codeError">{{ codeError }}</p>
      </div>
  

      <!-- Paso 3: escanear preregistro y finalizar -->
      <div v-else-if="step === 3">
        <QrStream @decode="onPreregrestrationDecode" />
        <p class="text-danger mt-2" v-if="codeError">{{ codeError }}</p>
      </div>


        <!-- Feedback final -->
            <div v-if="feedback" class="alert alert-success mt-3">
        {{ feedback }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { QrStream } from 'vue3-qr-reader'
  import { useRouter } from 'vue-router'
  import { auth, db } from '../firebase.js'
  import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
  import { signInAnonymously } from 'firebase/auth'
  import { useBusinessStore } from '../stores/business'


  const router = useRouter()
  

  // Estado de la secuencia
  const step = ref(1)            // 1=manilla, 2=RFID, 3=preregistro
  const rfidInput = ref('')      // Valor del RFID leido del usuario
  const rfidCaptured = ref(false)
  const rfidField      = ref(null)
  const scannedUid = ref('')     // ID de la manilla
  const scannedDocId = ref('')   // ID del documento de preregistro
  const preregData = ref(null)   // Datos obtenidos del preregistro
  const codeError = ref('')      // Mensaje de error para mostrar
  const feedback = ref('')
  const newUrl = ref('')


    // Contexto de negocio
  const businessStore = useBusinessStore()
  const businessId = businessStore.businessId || localStorage.getItem('businessId')
  const bizInfo  = JSON.parse(localStorage.getItem('businessInfo') || '{}')
  const businessName = bizInfo.name || businessStore.businessInfo.name
  
  
  

  // Parseo de QR: detecta preregistro (/preregistro/:b/:id) o manilla (string plano)
  function parseQrResult(result) {
    // 1) Si viene con ?uid= en cualquier parte de la cadena
    if (result.includes('?uid=')) {
        let uid = result.split('?uid=')[1].split('&')[0]
        return { type: 'codigosqr', uid }
    }

    try {

        // 2) Intentamos interpretar como URL estándar
        const url = new URL(result)

        // 2.a) preregistro: /preregistro/:businessId/:docId

        if (url.pathname.startsWith('/preregistro/')) {
        const [, , businessId, docId] = url.pathname.split('/')
        return { type: 'preregistro', businessId, docId }
        }

        // 2.b) si fuese otra URL con param uid en query

        const uidParam = url.searchParams.get('uid')
        if (uidParam) {
        return { type: 'codigosqr', uid: uidParam }
        }
        return null
    } catch {

        // 3) Cadena libre (se asume manilla)
        return { type: 'codigosqr', uid: result }
    }
    }

  
  // Paso 1: lectura de QR de manilla
  async function onManillaDecode(result) {
    codeError.value = ''
    const parsed = parseQrResult(result)
    if (!parsed || parsed.type !== 'codigosqr') {
      codeError.value = 'QR de manilla no válido'
      return
    }
    scannedUid.value = parsed.uid

    // Validar existencia en Firestore
    const qrRef = doc(db, 'CodigosQR', scannedUid.value)
    const snap = await getDoc(qrRef)
    if (!snap.exists()) {
      codeError.value = 'Manilla no encontrada'
      return
    }
    const data = snap.data()
    console.log("data:", data)
    if (data.estadoQR === 'Asignado' || data.estadoQR === 'Entregado') {
      codeError.value = 'Esta manilla ya fue entregada'
      return
    }
    step.value = 2
  }
  
  // Paso 2a: vincular manilla (actualiza RFID y estado)
  async function linkManilla() {
    codeError.value = ''
    newUrl.value = `https://qr1-evtica-com.web.app/registroPosterior/${scannedUid.value}`
    try {
      const qrRef = doc(db, 'CodigosQR', scannedUid.value)
      await updateDoc(qrRef, {
        RFID: rfidInput.value,
        businessId,
        businessName,
        estadoQR: 'Asignado',
        urlDestino: newUrl.value,
      })
      feedback.value = 'Manilla vinculada a usuario anónimo.'
      // Avanzar a preregistro
      setTimeout(resetState, 2000)
      //startPreregreScan()
    } catch (err) {
      codeError.value = err.message
    }
  }
  
  // Paso 2b: inicia escaneo de preregistro
  function startPreregreScan() {
    codeError.value = ''
    step.value = 3
  }
  
  // Paso 3: lectura de QR de preregistro y finalización
  async function onPreregrestrationDecode(result) {
    codeError.value = ''
    const parsed = parseQrResult(result)
    if (!parsed || parsed.type !== 'preregistro') {
      codeError.value = 'QR de preregistro no válido'
      return
    }


    //businessId.value = parsed.businessId
    scannedDocId.value = parsed.docId
  

    // Obtener datos del preregistro
    const preRef = doc(db, 'businesses', businessId, 'preregistro',scannedDocId.value)
    const preSnap = await getDoc(preRef)
    if (!preSnap.exists()) {
      codeError.value = 'Preregistro no encontrado'
      return
    }
    preregData.value = preSnap.data()
    console.log("preregData.value", preregData.value)
  
    await finalizeLink()
  }
  
  // Crea el usuario anónimo y vincula todo en Firestore
  async function finalizeLink() {
    newUrl.value = `https://qr1-evtica-com.web.app/registroPosterior/${scannedUid.value}`
    console.log("newUrl.value", newUrl.value)
    console.log("businessId.value", businessId)
    try {
      const { user } = await signInAnonymously(auth)

      // Crear registro en businesses/{businessId}/users/{uid}
      const userRef = doc(
        db,
        'businesses', businessId,
        'contacts', user.uid
      )
      await setDoc(userRef, {
        ...preregData.value,
        roles: ['Cliente'],
        uid: user.uid,
        RFID: rfidInput.value,
        createdAt: preregData.value.createdAt || serverTimestamp(),
        document: preregData.value.cedula,
        name: preregData.value.fullName,
        email: preregData.value.email,
        phone: preregData.value.phone,
        address: preregData.value.address || '',      // si tienes dirección en preregData
        roles: ['Cliente']   
      }, { merge: true })  

      
      // Marcar la manilla como asignada
      const qrRef = doc(db, 'CodigosQR', scannedUid.value)
      await updateDoc(qrRef, {
        estadoQR: 'Asignado',
        businessId,
        businessName,
        UsuarioVinculado: true,
        RFID: rfidInput.value,
        estadoQR: 'Asignado',
        urlDestino: newUrl.value,
        securityAnswer: preregData.value.answer,
        securityQuestion: preregData.value.question,
        fullName: preregData.value.fullName,
        phone: preregData.value.phone,
        birthDate: preregData.value.birthDate,
        cedula: preregData.value.cedula,
        email: preregData.value.email,
        })
      feedback.value = 'Datos vinculados a usuario anónimo.'
      setTimeout(resetState, 2000)
      // Guardar businessId y redirigir
      //localStorage.setItem('businessId', businessId.value)
      //router.push({ name: 'home' })
    } catch (err) {
      codeError.value = err.message
    }
  }

    // Paso 2: Captura RFID UHF (única vez)
    function onRfidInput(e) {
    // si ya capturamos, no hacemos nada
    if (rfidCaptured.value) return
    const v = e.target.value
    // si detectamos salto de línea en el string:
    if (v.includes('\n') || v.includes('\r')) {
        // quitamos todos los saltos de línea
        rfidInput.value = v.replace(/[\r\n]+/g, '')
        // marcamos como capturado y pasamos al siguiente paso
        rfidCaptured.value = true
        //step.value = 3
    }
    }

    function onRfidComplete() {
    // en caso de que el lector solo emule Enter
    if (rfidCaptured.value) return
    if (rfidInput.value) {
        rfidCaptured.value = true
        //step.value = 3
    }
    }

    // Resetear estado para nuevo escaneo
    function resetState() {
        step.value = 1
        scannedUid.value = ''
        codeError.value = ''
        //codeData.value = null
        rfidInput.value = ''
        rfidCaptured.value = false
        feedback.value = ''
    }
  </script>
  
  <style scoped>
  .qr-container {
    max-width: 400px;
    margin: 2rem auto;
  }
  </style>
  