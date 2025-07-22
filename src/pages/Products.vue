<template>
  <div class="container mt-5">
    <!-- Pestañas -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a href="#" 
           class="nav-link" 
           :class="{ active: activeTab === 'products' }" 
           @click.prevent="activeTab = 'products'">
          Productos
        </a>
      </li>
      <li class="nav-item">
        <a href="#"
           class="nav-link" 
           :class="{ active: activeTab === 'categories' }" 
           @click.prevent="activeTab = 'categories'">
          Categorías
        </a>
      </li>
    </ul>

    <!-- Pestaña de Productos -->
    <div v-if="activeTab === 'products'">
      <h2>Gestión de Productos</h2>
      <form @submit.prevent="addProduct" class="row g-3 mb-3">
        <div class="col-md-3">
          <input
            v-model="newProduct.name"
            type="text"
            class="form-control"
            placeholder="Nombre"
          />
        </div>
        <div class="col-md-2">
          <input
            v-model.number="newProduct.priceSale"
            type="number"
            class="form-control"
            placeholder="Precio Venta"
          />
        </div>
        <div class="col-md-2">
          <input
            v-model.number="newProduct.priceCost"
            type="number"
            class="form-control"
            placeholder="Precio Costo"
          />
        </div>
        <div class="col-md-2">
          <input
            v-model.number="newProduct.stock"
            type="number"
            class="form-control"
            placeholder="Stock"
          />
        </div>
        <!-- Campo para seleccionar la categoría -->
        <div class="col-md-3">
          <select v-model="newProduct.categoryId" class="form-select">
            <option disabled value="">Seleccione una Categoría</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <input
            type="file"
            class="form-control"
            @change="handleFileChange"
            accept="image/*"
          />
        </div>
        <div class="col-md-2">
          <button type="submit" class="btn btn-primary">Agregar</button>
        </div>
      </form>
    
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio Venta</th>
            <th>Precio Costo</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <img
                :src="product.imageUrl ? product.imageUrl : genericImage"
                alt="Product Image"
                style="width:100px; height:100px; object-fit:cover;"
              />
            </td>
            <td>{{ product.name }}</td>
            <td>{{ product.priceSale }}</td>
            <td>{{ product.priceCost }}</td>
            <td>{{ product.stock }}</td>
            <td>
              {{ getCategoryName(product.categoryId) }}
            </td>
            <td>
              <button
                class="btn btn-sm btn-warning me-2"
                @click="edit(product)"
              >
                Editar
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="remove(product.id)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    
      <!-- Modal para editar producto -->
      <div class="modal" tabindex="-1" ref="editModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="updateProduct">
              <div class="modal-header">
                <h5 class="modal-title">Editar Producto</h5>
                <button type="button" class="btn-close" @click="closeModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label>Nombre</label>
                  <input v-model="editProductData.name" type="text" class="form-control" />
                </div>
                <div class="mb-3">
                  <label>Precio Venta</label>
                  <input v-model.number="editProductData.priceSale" type="number" class="form-control" />
                </div>
                <div class="mb-3">
                  <label>Precio Costo</label>
                  <input v-model.number="editProductData.priceCost" type="number" class="form-control" />
                </div>
                <div class="mb-3">
                  <label>Stock</label>
                  <input v-model.number="editProductData.stock" type="number" class="form-control" />
                </div>
                <!-- Campo para editar la categoría -->
                <div class="mb-3">
                  <label>Categoría</label>
                  <select v-model="editProductData.categoryId" class="form-select">
                    <option disabled value="">Seleccione una Categoría</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.name }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label>Imagen</label>
                  <input
                    type="file"
                    class="form-control"
                    @change="handleEditFileChange"
                    accept="image/*"
                  />
                  <div class="mt-2">
                    <img
                      :src="editProductData.imageUrl ? editProductData.imageUrl : genericImage"
                      alt="Product Image"
                      style="width:100px; height:100px; object-fit:cover;"
                    />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cerrar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Pestaña de Categorías -->
    <div v-if="activeTab === 'categories'">
      <h2>Gestión de Categorías</h2>
      <form @submit.prevent="addCategory" class="row g-3 mb-3">
        <div class="col-md-4">
          <input
            v-model="newCategory.name"
            type="text"
            class="form-control"
            placeholder="Nombre de Categoría"
          />
        </div>
        <div class="col-md-2">
          <button type="submit" class="btn btn-primary">Agregar Categoría</button>
        </div>
      </form>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td>{{ cat.name }}</td>
            <td>
              <button class="btn btn-sm btn-warning me-2" @click="editCategory(cat)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="removeCategory(cat.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Modal para editar categoría -->
      <div class="modal" tabindex="-1" ref="editCategoryModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="updateCategory">
              <div class="modal-header">
                <h5 class="modal-title">Editar Categoría</h5>
                <button type="button" class="btn-close" @click="closeCategoryModal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label>Nombre</label>
                  <input v-model="editCategoryData.name" type="text" class="form-control" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeCategoryModal">Cerrar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'

export default {
  name: 'ProductsAndCategories',
  setup() {
    const businessId = localStorage.getItem('businessId') || ''
    const activeTab = ref('products')

    // Productos
    const products = ref([])
    const newProduct = ref({
      name: '',
      priceSale: 0,
      priceCost: 0,
      stock: 0,
      imageUrl: '',
      categoryId: ''
    })
    const newProductImage = ref(null)
    const genericImage = 'https://via.placeholder.com/300?text=No+Image'
    const editModal = ref(null)
    const editProductData = ref({
      id: null,
      name: '',
      priceSale: 0,
      priceCost: 0,
      stock: 0,
      imageUrl: '',
      categoryId: ''
    })
    const editProductImage = ref(null)
    const productsCol = collection(db, 'businesses', businessId, 'products')

    // Categorías
    const categories = ref([])
    const newCategory = ref({ name: '' })
    const editCategoryData = ref({
      id: null,
      name: ''
    })
    const editCategoryModal = ref(null)
    const categoriesCol = collection(db, 'businesses', businessId, 'categories')

    const storage = getStorage()

    // Funciones para Productos
    const fetchProducts = async () => {
      const snap = await getDocs(productsCol)
      products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    const handleFileChange = (e) => {
      const file = e.target.files[0]
      newProductImage.value = file
    }

    const handleEditFileChange = (e) => {
      const file = e.target.files[0]
      editProductImage.value = file
    }

    const uploadImage = async (file, productName) => {
      const filePath = `businesses/${businessId}/products/${productName}_${Date.now()}`
      const imgRef = storageRef(storage, filePath)
      await uploadBytes(imgRef, file)
      const url = await getDownloadURL(imgRef)
      return url
    }

    const addProduct = async () => {
      if (!newProduct.value.name) return
      // Si se selecciona imagen, se sube y se asigna la URL
      if (newProductImage.value) {
        const url = await uploadImage(newProductImage.value, newProduct.value.name)
        newProduct.value.imageUrl = url
      }
      await addDoc(productsCol, { ...newProduct.value })
      newProduct.value = { name: '', priceSale: 0, priceCost: 0, stock: 0, imageUrl: '', categoryId: '' }
      newProductImage.value = null
      fetchProducts()
    }

    const edit = (product) => {
      editProductData.value = { ...product }
      editProductImage.value = null
      showModal()
    }

    const showModal = () => {
      if (editModal.value) {
        const modalElement = editModal.value
        const modal = new bootstrap.Modal(modalElement)
        modal.show()
      }
    }

    const closeModal = () => {
      if (editModal.value) {
        const modalElement = editModal.value
        const modal = bootstrap.Modal.getInstance(modalElement)
        modal.hide()
      }
    }

    const updateProduct = async () => {
      if (editProductImage.value) {
        const url = await uploadImage(editProductImage.value, editProductData.value.name)
        editProductData.value.imageUrl = url
      }
      const docRef = doc(db, 'businesses', businessId, 'products', editProductData.value.id)
      await updateDoc(docRef, {
        name: editProductData.value.name,
        priceSale: editProductData.value.priceSale,
        priceCost: editProductData.value.priceCost,
        stock: editProductData.value.stock,
        imageUrl: editProductData.value.imageUrl,
        categoryId: editProductData.value.categoryId
      })
      closeModal()
      fetchProducts()
    }

    const remove = async (id) => {
      await deleteDoc(doc(db, 'businesses', businessId, 'products', id))
      fetchProducts()
    }

    // Funciones para Categorías
    const fetchCategories = async () => {
      const snap = await getDocs(categoriesCol)
      categories.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    const addCategory = async () => {
      if (!newCategory.value.name) return
      await addDoc(categoriesCol, { ...newCategory.value })
      newCategory.value = { name: '' }
      fetchCategories()
    }

    const editCategory = (cat) => {
      editCategoryData.value = { ...cat }
      showCategoryModal()
    }

    const showCategoryModal = () => {
      if (editCategoryModal.value) {
        const modalElement = editCategoryModal.value
        const modal = new bootstrap.Modal(modalElement)
        modal.show()
      }
    }

    const closeCategoryModal = () => {
      if (editCategoryModal.value) {
        const modalElement = editCategoryModal.value
        const modal = bootstrap.Modal.getInstance(modalElement)
        modal.hide()
      }
    }

    const updateCategory = async () => {
      const docRef = doc(db, 'businesses', businessId, 'categories', editCategoryData.value.id)
      await updateDoc(docRef, { name: editCategoryData.value.name })
      closeCategoryModal()
      fetchCategories()
    }

    const removeCategory = async (id) => {
      await deleteDoc(doc(db, 'businesses', businessId, 'categories', id))
      fetchCategories()
    }

    // Helper para obtener el nombre de la categoría en función del id
    const getCategoryName = (id) => {
      const category = categories.value.find(cat => cat.id === id)
      return category ? category.name : 'Sin Categoría'
    }

    onMounted(() => {
      fetchProducts()
      fetchCategories()
    })

    return {
      activeTab,
      products,
      newProduct,
      addProduct,
      edit,
      remove,
      editModal,
      editProductData,
      showModal,
      closeModal,
      updateProduct,
      handleFileChange,
      handleEditFileChange,
      genericImage,
      // Categorías
      categories,
      newCategory,
      addCategory,
      editCategory,
      removeCategory,
      editCategoryModal,
      editCategoryData,
      showCategoryModal,
      closeCategoryModal,
      updateCategory,
      getCategoryName
    }
  }
}
</script>

<style scoped>
/* Ajusta el estilo según sea necesario */
</style>
