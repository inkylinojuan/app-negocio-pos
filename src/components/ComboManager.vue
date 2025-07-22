<template>
  <div class="container mt-5">
    <h2>Gestión de Combos</h2>
    <!-- Formulario para crear un nuevo combo -->
    <form @submit.prevent="addCombo" class="mb-4">
      <div class="mb-3">
        <label>Nombre del Combo</label>
        <input
          v-model="newCombo.name"
          type="text"
          class="form-control"
          placeholder="Nombre del combo"
          required
        />
      </div>
      <div class="mb-3">
        <label>Precio de Venta</label>
        <input
          v-model.number="newCombo.priceSale"
          type="number"
          class="form-control"
          placeholder="Precio de venta"
          required
        />
      </div>
      <!-- Campo para seleccionar imagen del combo -->
      <div class="mb-3">
        <label>Imagen del Combo</label>
        <input
          type="file"
          class="form-control"
          @change="handleFileChange"
          accept="image/*"
        />
      </div>
      <h4>Componentes</h4>
      <div
        v-for="(component, index) in newCombo.components"
        :key="index"
        class="row mb-2"
      >
        <div class="col-md-6">
          <label>Producto</label>
          <select
            v-model="component.productId"
            class="form-select"
            required
          >
            <option disabled value="">Seleccione un producto</option>
            <option
              v-for="prod in products"
              :key="prod.id"
              :value="prod.id"
            >
              {{ prod.name }}
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label>Cantidad</label>
          <input
            v-model.number="component.quantity"
            type="number"
            class="form-control"
            min="1"
            required
          />
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button
            type="button"
            class="btn btn-danger"
            @click="removeComponent(index)"
          >
            Eliminar
          </button>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-secondary mb-3"
        @click="addComponent"
      >
        Agregar Componente
      </button>
      <br />
      <button type="submit" class="btn btn-primary">Crear Combo</button>
    </form>

    <h3>Combos Existentes</h3>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Precio Venta</th>
          <th>Componentes</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="combo in combos" :key="combo.id">
          <td>
            <img
              :src="combo.imageUrl ? combo.imageUrl : genericImage"
              alt="Combo Image"
              style="width:100px; height:100px; object-fit:cover;"
            />
          </td>
          <td>{{ combo.name }}</td>
          <td>{{ combo.priceSale }}</td>
          <td>
            <ul>
              <li v-for="(comp, idx) in combo.components" :key="idx">
                {{ getProductName(comp.productId) }} x {{ comp.quantity }}
              </li>
            </ul>
          </td>
          <td>
            <button
              class="btn btn-sm btn-warning me-2"
              @click="editCombo(combo)"
            >
              Editar
            </button>
            <button
              class="btn btn-sm btn-danger"
              @click="deleteCombo(combo.id)"
            >
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para edición de combo -->
    <div
      class="modal fade"
      id="editComboModal"
      tabindex="-1"
      aria-labelledby="editComboModalLabel"
      aria-hidden="true"
      ref="editModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form @submit.prevent="updateCombo">
            <div class="modal-header">
              <h5 class="modal-title" id="editComboModalLabel">
                Editar Combo
              </h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Nombre del Combo</label>
                <input
                  v-model="editComboData.name"
                  type="text"
                  class="form-control"
                  required
                />
              </div>
              <div class="mb-3">
                <label>Precio de Venta</label>
                <input
                  v-model.number="editComboData.priceSale"
                  type="number"
                  class="form-control"
                  required
                />
              </div>
              <!-- Campo para actualizar imagen del combo -->
              <div class="mb-3">
                <label>Imagen del Combo</label>
                <input
                  type="file"
                  class="form-control"
                  @change="handleEditFileChange"
                  accept="image/*"
                />
                <div class="mt-2">
                  <img
                    :src="editComboData.imageUrl ? editComboData.imageUrl : genericImage"
                    alt="Combo Image"
                    style="width:100px; height:100px; object-fit:cover;"
                  />
                </div>
              </div>
              <h4>Componentes</h4>
              <div
                v-for="(component, index) in editComboData.components"
                :key="index"
                class="row mb-2"
              >
                <div class="col-md-6">
                  <label>Producto</label>
                  <select
                    v-model="component.productId"
                    class="form-select"
                    required
                  >
                    <option disabled value="">Seleccione un producto</option>
                    <option
                      v-for="prod in products"
                      :key="prod.id"
                      :value="prod.id"
                    >
                      {{ prod.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label>Cantidad</label>
                  <input
                    v-model.number="component.quantity"
                    type="number"
                    class="form-control"
                    min="1"
                    required
                  />
                </div>
                <div class="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    class="btn btn-danger"
                    @click="removeEditComponent(index)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-secondary mb-3"
                @click="addEditComponent"
              >
                Agregar Componente
              </button>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cerrar
              </button>
              <button type="submit" class="btn btn-primary">
                Actualizar Combo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'

export default {
  name: 'ComboManager',
  setup() {
    const businessId = localStorage.getItem('businessId') || ''
    const newCombo = ref({
      name: '',
      priceSale: 0,
      components: [],
      imageUrl: ''
    })
    const newComboImage = ref(null)
    const combos = ref([])
    const products = ref([])

    // Imagen genérica para combos
    const genericImage = 'https://via.placeholder.com/300?text=No+Image'

    const storage = getStorage()

    // Función para subir imagen y obtener URL
    const uploadImage = async (file, comboName) => {
      const filePath = `businesses/${businessId}/combos/${comboName}_${Date.now()}`
      const imgRef = storageRef(storage, filePath)
      await uploadBytes(imgRef, file)
      const url = await getDownloadURL(imgRef)
      return url
    }

    const handleFileChange = (e) => {
      const file = e.target.files[0]
      newComboImage.value = file
    }

    const handleEditFileChange = (e) => {
      const file = e.target.files[0]
      editComboImage.value = file
    }

    const fetchProducts = async () => {
      const productsCol = collection(db, 'businesses', businessId, 'products')
      const snap = await getDocs(productsCol)
      products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    const fetchCombos = async () => {
      const combosCol = collection(db, 'businesses', businessId, 'combos')
      const snap = await getDocs(combosCol)
      combos.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    const addComponent = () => {
      newCombo.value.components.push({ productId: '', quantity: 1 })
    }

    const removeComponent = (index) => {
      newCombo.value.components.splice(index, 1)
    }

    const addCombo = async () => {
      if (!newCombo.value.name || !newCombo.value.priceSale || newCombo.value.components.length === 0) {
        alert("Complete los campos requeridos.")
        return
      }
      // Si se selecciona imagen, subirla y asignar la URL
      if (newComboImage.value) {
        const url = await uploadImage(newComboImage.value, newCombo.value.name)
        newCombo.value.imageUrl = url
      }
      await addDoc(collection(db, 'businesses', businessId, 'combos'), newCombo.value)
      newCombo.value = { name: '', priceSale: 0, components: [], imageUrl: '' }
      newComboImage.value = null
      fetchCombos()
    }

    // Edición de combos
    const editComboData = ref({
      id: '',
      name: '',
      priceSale: 0,
      components: [],
      imageUrl: ''
    })
    const editModal = ref(null)
    const editComboImage = ref(null)

    const editCombo = (combo) => {
      // Clonar el objeto para edición
      editComboData.value = JSON.parse(JSON.stringify(combo))
      editComboImage.value = null
      showModal()
    }

    const addEditComponent = () => {
      editComboData.value.components.push({ productId: '', quantity: 1 })
    }

    const removeEditComponent = (index) => {
      editComboData.value.components.splice(index, 1)
    }

    const updateCombo = async () => {
      // Si se selecciona nueva imagen en edición, subirla y actualizar la URL
      if (editComboImage.value) {
        const url = await uploadImage(editComboImage.value, editComboData.value.name)
        editComboData.value.imageUrl = url
      }
      const comboDoc = doc(db, 'businesses', businessId, 'combos', editComboData.value.id)
      await updateDoc(comboDoc, {
        name: editComboData.value.name,
        priceSale: editComboData.value.priceSale,
        components: editComboData.value.components,
        imageUrl: editComboData.value.imageUrl
      })
      closeModal()
      fetchCombos()
    }

    const deleteCombo = async (id) => {
      await deleteDoc(doc(db, 'businesses', businessId, 'combos', id))
      fetchCombos()
    }

    // Modal control (usando Bootstrap)
    const showModal = () => {
      editModal.value = new bootstrap.Modal(document.getElementById('editComboModal'))
      editModal.value.show()
    }

    const closeModal = () => {
      if (editModal.value) {
        editModal.value.hide()
      }
    }

    const getProductName = (productId) => {
      const prod = products.value.find(p => p.id === productId)
      return prod ? prod.name : productId
    }

    onMounted(() => {
      fetchProducts()
      fetchCombos()
    })

    return {
      newCombo,
      combos,
      products,
      addComponent,
      removeComponent,
      addCombo,
      editCombo,
      editComboData,
      addEditComponent,
      removeEditComponent,
      updateCombo,
      deleteCombo,
      closeModal,
      getProductName,
      handleFileChange,
      handleEditFileChange,
      genericImage
    }
  }
}
</script>

<style scoped>
/* Puedes agregar estilos personalizados aquí */
</style>

  