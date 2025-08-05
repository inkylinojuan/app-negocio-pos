<template>
    <MenuInventario />
    <div class="container py-4">
      <h2>Órdenes de Pedido</h2>
      <!-- Pestañas de estados -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item" v-for="status in statusTabs" :key="status">
          <a class="nav-link" :class="{ active: activeTab === status }" 
             @click.prevent="activeTab = status">
            {{ status }}
          </a>
        </li>
      </ul>
      
      <!-- Botón crear nueva orden (solo visible en Pedida) -->
      <button v-if="activeTab === 'Pedida'" 
              class="btn btn-primary mb-3" 
              @click="openCreateModal">
        Nueva Orden
      </button>

      <!-- Tabla de órdenes -->
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Número</th>
            <th>Solicitante</th>
            <th>Evento</th>
            <th>Status</th>
            <th>Fecha Solicitud</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <!-- Filtrar órdenes por pestaña activa -->
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>{{ order.number }}</td>
            <td>{{ order.requester.name }}</td>
            <td>{{ order.eventName }}</td>
            <td>{{ order.status }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
                <button v-if="order.status === 'Pedida'" 
                      class="btn btn-sm btn-success me-1" 
                      @click="openPackingModal(order)">
                Empacar
              </button>
              <button v-if="order.status === 'Empacada' || order.status === 'Despachada' || order.status === 'Entregado' || order.status === 'Retornada'"
                      class="btn btn-sm btn-primary me-1"
                      @click="openPackedOrderModal(order)">
                {{ order.status === 'Empacada' ? 'Ver Pedido Empacado' : (order.status === 'Despachada' ? 'Ver Pedido Despachado' : (order.status === 'Entregado' ? 'Ver Pedido Entregado' : 'Ver Pedido Retornado')) }}
              </button>
              <button v-if="order.status === 'Pedida'" class="btn btn-sm btn-info me-1" @click="openEditModal(order)">Editar</button>
              <button v-if="order.status === 'Pedida'" class="btn btn-sm btn-danger" @click="deleteOrder(order.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <!-- Modal Crear/Editar Orden -->
      <div v-if="showModal" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <form @submit.prevent="saveOrder">
              <div class="modal-header">
                <h5 class="modal-title">{{ isEditing ? 'Editar' : 'Nueva' }} Orden</h5>
                <button type="button" class="btn-close" @click="closeModal"></button>
              </div>
              <div class="modal-body">
                <!-- Consecutivo -->
                <div class="mb-3">
                  <label class="form-label">Número</label>
                  <input v-model="form.number" type="text" class="form-control" disabled />
                </div>
                <!-- Solicitante y datos evento -->
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Nombre solicitante</label>
                    <input v-model="form.requester.name" class="form-control" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Cargo / Organización</label>
                    <input v-model="form.requester.position" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Tipo de evento</label>
                    <input v-model="form.eventType" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nombre del evento</label>
                    <input v-model="form.eventName" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Dirección</label>
                    <input v-model="form.address" class="form-control" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Ciudad</label>
                    <input v-model="form.city" class="form-control" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Fecha del evento</label>
                    <input v-model="form.eventDate" type="date" class="form-control" />
                  </div>
                </div>
                <!-- Fechas de entrega/devolución -->
                <div class="row g-3 mt-3">
                  <div class="col-md-6">
                    <label class="form-label">Fecha entrega equipos</label>
                    <input v-model="form.deliveryDate" type="date" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Fecha devolución equipos</label>
                    <input v-model="form.returnDate" type="date" class="form-control" />
                  </div>
                </div>
                <!-- Responsables -->
                <div class="row g-3 mt-3">
                  <div class="col-md-6">
                    <label class="form-label">Responsable empaque</label>
                    <input v-model="form.responsibles.packing" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Responsable entrega</label>
                    <input v-model="form.responsibles.delivery" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Responsable transporte</label>
                    <input v-model="form.responsibles.transport" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Responsable devolución</label>
                    <input v-model="form.responsibles.return" class="form-control" />
                  </div>
                </div>
                <!-- Estado -->
                <div class="mb-3 mt-3">
                  <label class="form-label">Estado</label>
                  <select v-model="form.status" class="form-select">
                    <option value="Pedida">Pedida</option>
                    <option value="Empacada">Empacada</option>
                    <option value="Despachada">Despachada</option>
                    <option value="Entregada">Entregada</option>
                  </select>
                </div>
                <div class="row mb-3 align-items-end">
                  <!-- Selección de plantilla de grupo -->
                  <div class="col-md-6">
                    <label class="form-label">Agregar por Grupo</label>
                    <select v-model="selectedGroup" @change="onGroupSelect" class="form-select">
                      <option value="" disabled>Seleccionar grupo…</option>
                      <option v-for="g in groups" :key="g.id" :value="g">
                        {{ g.name }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6 text-end">
                    <button class="btn btn-sm btn-outline-secondary" @click="clearGroupSelection">
                      Limpiar selección
                    </button>
                  </div>
                </div>
                <!-- Items -->
                <h5>Equipos solicitados</h5>
                <table class="table table-sm table-bordered">
                  <thead class="table-light">
                    <tr>
                      <th>Categoría</th>
                      <th style="width:80px">Cantidad</th>
                      <th style="width:80px">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in form.items" :key="idx">
                      <!-- CATEGORÍA: si no está asignada, muestro el datalist, si ya la eligió, solo el texto -->
                      <td>
                        <template v-if="!item.category">
                          <input
                            list="cat-list"
                            v-model="item.categoryName"
                            @change="onCategoryChange(item)"
                            class="form-control form-control-sm"
                            placeholder="Selecciona categoría"
                          />
                          <datalist id="cat-list">
                            <option v-for="c in categories" :key="c.id" :value="c.name"/>
                          </datalist>
                        </template>
                        <template v-else>
                          {{ item.categoryName }}
                        </template>
                      </td>

                      <!-- CANTIDAD: siempre editable -->
                      <td>
                        <input
                          type="number"
                          v-model.number="item.quantity"
                          class="form-control form-control-sm"
                          min="1"
                          @change="checkAvailability(item)"
                        />
                      </td>

                      <!-- ACCIÓN: eliminar línea -->
                      <td>
                        <button class="btn btn-sm btn-outline-danger" @click.prevent="removeItem(idx)">
                          ✕
                        </button>
                      </td>
                    </tr>

                    <tr v-if="form.items.length === 0">
                      <td colspan="3" class="text-center text-muted">
                        No hay equipos solicitados
                      </td>
                    </tr>
                  </tbody>
                </table>
                <!-- opcionalmente dejas tu botón para agregar uno a uno -->
                <button class="btn btn-sm btn-secondary" @click.prevent="addItem">
                  + Agregar equipo
                </button>
                <p class="mt-2"><strong>Total líneas:</strong> {{ form.items.length }}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar Orden</button>
              </div>
            </form>
          </div>
        </div>
      </div>

            <!-- Modal de Empacado -->
            <div v-if="showPackingModal" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-fullscreen-sm-down modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Empacar Orden #{{ currentOrder.number }}</h5>
              <button type="button" class="btn-close" @click="closePackingModal"></button>
            </div>
            <div class="modal-body">
              <!-- Información de la orden (solo lectura) -->
              <div class="mb-3">
                <strong>Solicitante:</strong> {{ currentOrder.requester.name }}<br>
                <strong>Evento:</strong> {{ currentOrder.eventName }}<br>
                <strong>Fecha del evento:</strong> {{ formatDate(currentOrder.eventDate) }}<br>
              </div>
              <h5>Equipos solicitados</h5>
              <div class="mb-3 d-flex justify-content-end">
                <button class="btn btn-sm btn-success" @click="readAll">
                  Leer Todo
                </button>
              </div>
              <!-- justo encima del v-for actual -->
              <div v-if="readingAllMode" class="mb-4 p-3 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5>Lectura Masiva de Activos</h5>
                  <button class="btn btn-sm btn-outline-danger" @click="stopBulkRead">
                    Detener Lectura
                  </button>
                </div>

                <div v-for="item in currentOrder.items" :key="item.category.id" class="mb-3">
                  <strong>{{ item.categoryName }}</strong>
                  <span class="ms-2 badge bg-info">
                    {{ (detectedAssetsAll[item.category.id] || []).length }} / {{ item.quantity }}
                  </span>
                  <ul class="list-group list-group-sm mt-1">
                    <li v-for="a in detectedAssetsAll[item.category.id]" :key="a.id" class="list-group-item">
                      {{ a.activo.nombre }} — {{ a.tag }}
                    </li>
                  </ul>
                </div>

                <button 
                  class="btn btn-success w-100" 
                  :disabled="!isAllDetected" 
                  @click="assignAllBulk">
                  Asignar todos los activos detectados
                </button>
              </div>

              <div v-for="(item, idx) in currentOrder.items" :key="idx" class="mb-4">
                <div v-if="!item.completed" class="d-flex justify-content-between align-items-center mb-2">
                  <h6>{{ item.categoryName }} (Cantidad: {{ item.quantity }})</h6>
                  <button class="btn btn-sm btn-primary" 
                        @click="handleClickLoadAssets(item, $event)" 
                        :disabled="item.completed">
                        {{ item.completed ? 'Completado' : 'Leer activos' }}
                    </button>
                </div>

                <div v-if="readingAllMode && !item.completed">
                  <h6>Activos detectados ({{ detectedAssetsAll[item.category.id]?.length }} / {{ item.quantity }})</h6>
                  <ul class="list-group mb-3">
                    <li v-for="a in detectedAssetsAll[item.category.id]" :key="a.id" class="list-group-item">
                      {{ a.activo.nombre }} — {{ a.tag }}
                    </li>
                  </ul>
                  <button class="btn btn-sm btn-success"
                          :disabled="detectedAssetsAll[item.category.id].length !== item.quantity"
                          @click="() => assignAssetsToCategory(item, detectedAssetsAll[item.category.id])">
                    Asignar todos
                  </button>
                </div>
                <!-- Lista de activos disponibles para esta categoría -->
                <div v-if="currentCategoryAssets[item.category.id] && activeCategoryId === item.category.id" class="mb-3">
                    <a class="btn btn-link p-0 mb-2" 
                        @click="toggleAvailableAssets(item.category.id)" 
                        role="button" 
                        :aria-expanded="isAvailableAssetsOpen(item.category.id)"
                        :aria-controls="'collapseAssets-' + item.category.id">
                        Activos disponibles ({{ currentCategoryAssets[item.category.id].length }}) 
                        <i :class="isAvailableAssetsOpen(item.category.id) ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
                    </a>
                  
                  <div class="collapse" :class="{ 'show': isAvailableAssetsOpen(item.category.id) }" :id="'collapseAssets-' + item.category.id">
                    <ul class="list-group">
                      <li v-for="asset in sortedAvailableAssets(item.category.id)" 
                          :key="asset.id"
                          class="list-group-item d-flex justify-content-between align-items-center"
                          :class="{ 'list-group-item-success': isAssetCurrentlyDetected(asset.id) }">
                        <span>{{ asset.activo.nombre }} / {{ asset.activo.codigoInterno }} ({{ asset.activo.ubicacion.name }})</span>
                        <span class="badge bg-success" v-if="isAssetCurrentlyDetected(asset.id)">
                          <i class="bi bi-check-lg"></i> Seleccionado
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Estado de lectura RFID -->
                <div v-if="rfidReadingActive && activeCategoryId === item.category.id" class="alert alert-info">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>Modo lectura RFID activo - Escaneando activos...</span>
                    <button class="btn btn-sm btn-outline-danger" @click="stopRFIDReading">Detener</button>
                  </div>
                  <div class="mt-2">
                    <strong>Activos leídos:</strong> {{ rfidDetectedAssets.length }}/{{ item.quantity }}
                  </div>
                </div>
                <!-- Activos detectados para esta categoría -->
                <div v-if="rfidDetectedAssets.length > 0 && activeCategoryId === item.category.id">
                <h6>Activos seleccionados:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                    <thead>
                        <tr>
                        <th>Nombre</th>
                        <th>Serial</th>
                        <th>RFID</th>
                        <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="asset in rfidDetectedAssets" :key="asset.id">
                        <!-- asset.activo.name o asset.activo.nombre según tu JSON -->
                        <td>{{ asset.activo.nombre }}</td>
                        <td>{{ asset.activo.codigoInterno}}</td>
                        <!-- aquí usas tag que te viene en el objeto -->
                        <td>{{ asset.tag }}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" 
                                    @click="removeDetectedAsset(asset.id)">
                            Quitar
                            </button>
                        </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
                </div>

                <!-- Botón para asignar activos -->
                <div v-if="activeCategoryId === item.category.id" class="mt-3">
                  <button class="btn btn-success" 
                          @click="assignAssetsToCategory(item)"
                          :disabled="rfidDetectedAssets.length !== item.quantity">
                    Asignar {{ rfidDetectedAssets.length }}/{{ item.quantity }} activos a esta categoría
                  </button>
                </div>
                <div v-if="item.completed && item.assignedAssets && item.assignedAssets.length > 0" class="mt-3 alert alert-success p-2">
                <!--<h6>Activos asignados a esta categoría:</h6>-->
                <ul class="list-group list-group-flush">
                    <li v-for="assignedAsset in item.assignedAssets" :key="assignedAsset.id" class="list-group-item list-group-item-success">
                        <strong>{{ assignedAsset.nombre }}</strong> ({{ assignedAsset.codigoInterno }}) / {{ assignedAsset.ubicacionId }}
                      </li>
                  </ul>
              </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closePackingModal">Cerrar</button>
              <button type="button" class="btn btn-primary" 
                      :disabled="!isPackingComplete" 
                      @click="completePacking">
                Completar Empacado
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showPackedOrderModal" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalles de Pedido Empacado #{{ currentPackedOrder.number }}</h5>
              <button type="button" class="btn-close" @click="closePackedOrderModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-4 p-3 bg-light rounded">
                <div class="row">
                  <div class="col-md-6">
                    <strong>Solicitante:</strong> {{ currentPackedOrder.requester?.name }}<br>
                    <strong>Evento:</strong> {{ currentPackedOrder.eventName }}<br>
                    <strong>Fecha Evento:</strong> {{ formatDate(currentPackedOrder.eventDate) }}<br>
                    <strong>Dirección:</strong> {{ currentPackedOrder.address }}, {{ currentPackedOrder.city }}<br>
                  </div>
                  <div class="col-md-6">
                    <strong>Fecha de Entrega:</strong> {{ formatDate(currentPackedOrder.deliveryDate) }}<br>
                    <strong>Fecha de Devolución:</strong> {{ formatDate(currentPackedOrder.returnDate) }}<br>
                    <strong>Empacado por:</strong> {{ currentPackedOrder.responsibles?.packing }}<br>
                    <strong>Status:</strong> <span class="badge bg-success">{{ currentPackedOrder.status }}</span>
                  </div>
                </div>
              </div>
              <div v-if="currentPackedOrder.status === 'Empacada'" class="mb-4 p-3 border rounded shadow-sm bg-light">
                <h6>Registro de Despacho:</h6>
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label for="dispatchNotes" class="form-label">Notas de Despacho</label>
                    <textarea id="dispatchNotes" v-model="dispatchForm.notes" class="form-control" rows="2"></textarea>
                  </div>
                  <div class="col-md-6">
                    <label for="dispatchResponsible" class="form-label">Responsable que Entrega (Empaque)</label>
                    <input type="text" id="dispatchResponsible" v-model="dispatchForm.deliveryResponsible" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="dispatchDate" class="form-label">Fecha de Entrega a Despachos</label>
                    <input type="date" id="dispatchDate" v-model="dispatchForm.dispatchDate" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="dispatchTime" class="form-label">Hora de Entrega a Despachos</label>
                    <input type="time" id="dispatchTime" v-model="dispatchForm.dispatchTime" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="receiveResponsible" class="form-label">Responsable que Recibe (Transportador)</label>
                    <input type="text" id="receiveResponsible" v-model="dispatchForm.receiveResponsible" class="form-control">
                  </div>
                </div>
                <button class="btn btn-primary w-100" @click="markOrderAsDispatched">
                  Marcar Pedido como Despachado
                </button>
              </div>

              <div v-if="currentPackedOrder.status === 'Despachada' || currentPackedOrder.status === 'Entregado'" class="mb-4 p-3 border rounded shadow-sm bg-info bg-opacity-10">
                <h6>Detalles de Despacho:</h6>
                <div class="row">
                  <div class="col-md-6">
                    <strong>Notas:</strong> {{ currentPackedOrder.dispatch?.notes || 'N/A' }}<br>
                    <strong>Entrega (Empaque):</strong> {{ currentPackedOrder.dispatch?.deliveryResponsible || 'N/A' }}<br>
                  </div>
                  <div class="col-md-6">
                    <strong>Fecha/Hora Despacho:</strong> 
                    <template v-if="currentPackedOrder.dispatch?.dispatchDate && currentPackedOrder.dispatch?.dispatchTime">
                      {{ formatDate(currentPackedOrder.dispatch.dispatchDate) }} {{ currentPackedOrder.dispatch.dispatchTime }}
                    </template>
                    <template v-else>N/A</template><br>
                    <strong>Recibe (Transportador):</strong> {{ currentPackedOrder.dispatch?.receiveResponsible || 'N/A' }}<br>
                  </div>
                </div>
              </div>

              <div v-if="currentPackedOrder.status === 'Despachada'" class="mb-4 p-3 border rounded shadow-sm bg-light">
                <h6>Registro de Entrega:</h6>
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label for="deliveryResponsible" class="form-label">Responsable que Entrega (Transportador)</label>
                    <input type="text" id="deliveryResponsible" v-model="deliveryForm.deliveryResponsible" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label for="receivedBy" class="form-label">Persona que Recibe el Pedido</label>
                    <input type="text" id="receivedBy" v-model="deliveryForm.receivedBy" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label for="actualDeliveryDate" class="form-label">Fecha de Entrega Final</label>
                    <input type="date" id="actualDeliveryDate" v-model="deliveryForm.actualDeliveryDate" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label for="actualDeliveryTime" class="form-label">Hora de Entrega Final</label>
                    <input type="time" id="actualDeliveryTime" v-model="deliveryForm.actualDeliveryTime" class="form-control">
                  </div>
                </div>
                <button class="btn btn-success w-100" @click="markOrderAsDelivered">
                  Marcar Pedido como Entregado
                </button>
              </div>

              <div v-if="currentPackedOrder.status === 'Entregado'" class="mb-4 p-3 border rounded shadow-sm bg-success bg-opacity-10">
                <h6>Detalles de Entrega Final:</h6>
                <div class="row">
                  <div class="col-md-6">
                    <strong>Entrega (Transportador):</strong> {{ currentPackedOrder.delivery?.deliveryResponsible || 'N/A' }}<br>
                    <strong>Recibido por:</strong> {{ currentPackedOrder.delivery?.receivedBy || 'N/A' }}<br>
                  </div>
                  <div class="col-md-6">
                    <strong>Fecha/Hora Entrega:</strong> 
                    <template v-if="currentPackedOrder.delivery?.actualDeliveryDate && currentPackedOrder.delivery?.actualDeliveryTime">
                      {{ formatDate(currentPackedOrder.delivery.actualDeliveryDate) }} {{ currentPackedOrder.delivery.actualDeliveryTime }}
                    </template>
                    <template v-else>N/A</template><br>
                  </div>
                </div>
              </div>

              <div class="row mb-3 align-items-center">
                <div class="col-md-6">
                  <input type="text" v-model="assetSearchQuery" class="form-control" placeholder="Buscar activo por nombre, código o RFID...">
                </div>
                <div class="col-md-6 text-end">
                  <button class="btn btn-outline-secondary me-2" @click="resetAssetFilters">Limpiar Filtros</button>
                  <button class="btn btn-info" @click="printPackedOrder">Imprimir Listado</button>
                </div>
              </div>

              <h5>Activos Asignados ({{ filteredAssignedAssets.length }} / {{ totalAssetsInOrder }})</h5>
              <div class="table-responsive">
                <table class="table table-striped table-hover table-sm">
                  <thead>
                    <tr>
                      <th @click="setSort('categoryName')" class="sortable">Categoría <i :class="getSortIcon('categoryName')"></i></th>
                      <th @click="setSort('nombre')" class="sortable">Nombre Activo <i :class="getSortIcon('nombre')"></i></th>
                      <th @click="setSort('codigoInterno')" class="sortable">Código Interno <i :class="getSortIcon('codigoInterno')"></i></th>
                      <th @click="setSort('rfid')" class="sortable">RFID <i :class="getSortIcon('rfid')"></i></th>
                      <th @click="setSort('ubicacionId')" class="sortable">Ubicación <i :class="getSortIcon('ubicacionId')"></i></th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredAssignedAssets.length === 0">
                      <td colspan="6" class="text-center text-muted">No se encontraron activos que coincidan con la búsqueda.</td>
                    </tr>
                    <tr v-for="asset in filteredAssignedAssets" :key="asset.id">
                      <td>{{ getCategoryNameForItem(asset.id) }}</td> <td>{{ asset.nombre }}</td>
                      <td>{{ asset.codigoInterno }}</td>
                      <td>{{ asset.id }}</td>
                      <td>{{ asset.ubicacionId }}</td>
                      <td>{{ asset.descripcion }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closePackedOrderModal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
import { ref, onMounted, computed, watch } from 'vue' // Agrega 'watch'
import { db } from '../../firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  runTransaction,
  query,
  where,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import MenuInventario from '../../components/MenuInventario.vue'

export default {
  components: { MenuInventario },
  setup() {
    const businessId = localStorage.getItem('businessId')
    const ordersCol = collection(db, 'businesses', businessId, 'loanOrders')
    const counterDoc = doc(db, 'businesses', businessId, 'counters', 'loanOrders')

    const orders = ref([])
    const categories = ref([])

    const showModal = ref(false)
    const isEditing = ref(false)
    const form = ref({
      id: null,
      number: '',
      requester: { name: '', position: '' },
      eventType: '',
      eventName: '',
      address: '',
      city: '',
      eventDate: '',
      deliveryDate: '',
      returnDate: '',
      responsibles: { packing: '', delivery: '', transport: '', return: '' },
      status: 'Pedida',
      items: []
    })

    const statusTabs = ['Pedida', 'Empacada', 'Despachada', 'Entregada']
    const activeTab = ref('Pedida')

    // Estados para el modal de empacado
    const showPackingModal = ref(false)
    const currentOrder = ref(null)
    const activeCategoryId = ref(null)
    const currentCategoryAssets = ref({})
    const rfidReadingActive = ref(false)
    const rfidDetectedAssets = ref([])
    const rfidInputBuffer = ref('')
    let rfidTimeout = null
    const RFID_DEBOUNCE_TIME = 100 // ms - Ajusta este valor si es necesario, 100-200ms suele funcionar bien
    const lastProcessedRFID = ref('') // Para evitar lecturas duplicadas inmediatas
    let rfidReaderActive = false; // Flag para controlar el listener del teclado
    const availableAssetsOpenState = ref({}); // { categoryId: boolean, ... }

    const showPackedOrderModal = ref(false)
    const currentPackedOrder = ref(null)
    const assetSearchQuery = ref('') // Para el campo de búsqueda de activos
    const sortBy = ref('categoryName') // Campo por defecto para ordenar
    const sortDirection = ref('asc') // Dirección de ordenamiento (asc/desc)

    const locations = ref([]); // Para almacenar las ubicaciones y mostrar sus nombres
    const searchQuery = ref(''); // Variable para el campo de búsqueda global

          // Nuevos estados para el flujo de despacho/entrega
          const dispatchForm = ref({
        notes: '',
        deliveryResponsible: '',
        dispatchDate: '',
        dispatchTime: '',
        receiveResponsible: ''
      });
      const deliveryForm = ref({
        deliveryResponsible: '', // El transportador
        receivedBy: '',          // La persona que firma y recibe
        actualDeliveryDate: '',
        actualDeliveryTime: ''
      });

      const rfidVerificados = ref(new Set())
      // —————————— nuevo estado para Grupos ——————————
      const groups         = ref([])
      const selectedGroup  = ref(null)

      const readingAllMode    = ref(false)
      const loadedAssetsAll   = ref({})  // { categoriaId: [ activos… ] }
      const detectedAssetsAll = ref({})  // { categoriaId: [ detectados… ] }

      // Asegúrate de que 'currentTab' esté definido y con un valor inicial:
      //const currentTab = ref('pedida') // O 'empacada', según tu preferencia inicial

    // Cargar órdenes y categorías
    onMounted(async () => {
      await loadOrders()
      const catsSnap = await getDocs(collection(db, 'businesses', businessId, 'loanCategories'))
      categories.value = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Cargar ubicaciones
      const locsSnap = await getDocs(collection(db, 'businesses', businessId, 'locations'))
      locations.value = locsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const grpSnap = await getDocs(collection(db, 'businesses', businessId, 'grupos'))
      groups.value = grpSnap.docs.map(d => ({ id:d.id, ...d.data() }))
      // Exponer funciones y datos al contexto global
      window.handleRFIDVerificacion = handleRFIDVerificacion
      window.rfidVerificados = rfidVerificados
      window.currentPackedOrder = currentPackedOrder
      window.processRFIDTag = processRFIDTag

    })

    // Define la función de verificación
    function handleRFIDVerificacion(tag) {
      const cleanTag = tag.toUpperCase().trim()

      if (
        !window.currentPackedOrder ||
        !window.currentPackedOrder.value ||
        !Array.isArray(window.currentPackedOrder.value.items)
      ) {
        console.warn("⚠️ currentPackedOrder no está listo o mal estructurado")
        return
      }

      const allAssets = window.currentPackedOrder.value.items.flatMap(item =>
        Array.isArray(item.assignedAssets) ? item.assignedAssets : []
      )

      const match = allAssets.find(asset => asset.rfid?.toUpperCase() === cleanTag)

      if (match) {
        if (!rfidVerificados.value.has(cleanTag)) {
          rfidVerificados.value.add(cleanTag)
          rfidVerificados.value = new Set(rfidVerificados.value) // forzar reactividad
          console.log(`✅ Verificado: ${cleanTag}`)
        }
      } else {
        console.warn(`❌ Tag no reconocido: ${cleanTag}`)
      }
    }

    const isPackingComplete = computed(() => {
      if (!currentOrder.value) return false
      return currentOrder.value.items.every(item => item.completed)
    })

    function openPackingModal(order) {
        currentOrder.value = JSON.parse(JSON.stringify(order))
        
        // Inicializar estado de completado y asignaciones para cada categoría
        currentOrder.value.items.forEach(item => {
          item.completed = item.completed || false;
          // Asegurarse de que assignedAssets siempre sea un array.
          // Si ya existen asignaciones (ej: al re-abrir una orden), se mantienen.
          item.assignedAssets = item.assignedAssets || []; 
          // Si la categoría ya está completada, los assets asignados deben estar ya cargados
          // Puedes considerar recargar la data completa de estos assets aquí si assignedAssets
          // solo guarda IDs y necesitas los detalles para mostrarlos.
          // Por ahora, asumimos que los detalles se buscarán con `findAssignedAssetDetails`.
        })
        
        showPackingModal.value = true
        availableAssetsOpenState.value = {}; // Limpiar el estado de despliegue al abrir el modal
      }

    // --- Función Wrapper para manejar el click y el blur ---
    function handleClickLoadAssets(item, event) {
        loadAssetsForCategory(item);
        // Quitar el foco del botón después de hacer clic
        if (event.target) {
          event.target.blur();
        }
      }

      function closePackingModal() {
        stopRFIDReading()
        showPackingModal.value = false
        currentOrder.value = null; // Limpiar la orden actual al cerrar
        rfidDetectedAssets.value = []; // Limpiar los activos detectados
        activeCategoryId.value = null; // Limpiar la categoría activa
        availableAssetsOpenState.value = {}; // Asegurarse de limpiar al cerrar
      }

    async function loadAssetsForCategory(item) {
      activeCategoryId.value = item.category.id;
      rfidDetectedAssets.value = []; // Limpiar los activos detectados para la nueva categoría

      // Cargar activos disponibles para esta categoría
      // Es crucial que el 'category.name' en 'tagsMovil' coincida exactamente con 'item.categoryName'
      const assetsQuery = query(
        collection(db, 'businesses', businessId, 'tagsMovil'),
        where('activo.category.name', '==', item.categoryName),
        where('status', '==', 'Disponible') // Solo activos disponibles
      )

      const assetsSnap = await getDocs(assetsQuery)
      const assets = assetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      currentCategoryAssets.value = {
        ...currentCategoryAssets.value,
        [item.category.id]: assets
      }
      console.log(`Activos disponibles para ${item.categoryName}:`, assets)

      startRFIDReading()
    }

    // --- Lógica de Lectura RFID Mejorada ---

    // Función que se ejecuta cada vez que el lector envía un carácter
    function handleRFIDInput(event) {
      // Ignorar teclas de control, alt, meta, o si no es un caracter imprimible
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1 || event.key === 'Enter') {
        return;
      }

      // Concatenar caracteres al buffer
      rfidInputBuffer.value += event.key;

      // Resetear el temporizador de debounce
      clearTimeout(rfidTimeout);
      rfidTimeout = setTimeout(processRFIDBuffer, RFID_DEBOUNCE_TIME);
    }

    // Función para procesar el buffer cuando el lector ha terminado de enviar el ID
    function processRFIDBuffer() {
      if (rfidInputBuffer.value.length > 0) {
        const rawTag = rfidInputBuffer.value;
        rfidInputBuffer.value = ''; // Limpiar el buffer inmediatamente

        // Procesar el tag leído
        processRFIDTag(rawTag);
      }
    }

    function startRFIDReading() {
      if (!rfidReaderActive) {
        rfidReadingActive.value = true;
        rfidInputBuffer.value = '';
        lastProcessedRFID.value = ''; // Resetear el último RFID procesado
        window.addEventListener('keypress', handleRFIDInput); // Usamos keypress para caracteres
        rfidReaderActive = true;
        console.log("Modo lectura RFID activo. Escaneando...");
      }
    }

    function stopRFIDReading() {
      if (rfidReaderActive) {
        rfidReadingActive.value = false;
        clearTimeout(rfidTimeout); // Asegurarse de limpiar cualquier temporizador pendiente
        window.removeEventListener('keypress', handleRFIDInput);
        rfidReaderActive = false;
        console.log("Modo lectura RFID detenido.");
      }
    }

function processRFIDTag(rawTag) {
  // 1) Normalizar
  const cleanTag = String(rawTag).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (!cleanTag) return

  // 2) Debounce guard
  if (cleanTag === lastProcessedRFID.value) return
  lastProcessedRFID.value = cleanTag

  // 3) Elegir el “pool” de assets a buscar
  const pool = readingAllMode.value
    ? loadedAssetsAll.value
    : { [activeCategoryId.value]: currentCategoryAssets.value[activeCategoryId.value] || [] }

  let foundAsset = null, foundCatId = null

  // 4) Buscar en cada categoría
  for (const [catId, assets] of Object.entries(pool)) {
    // saltar si ya completamos la cantidad de esa categoría
    const item   = currentOrder.value.items.find(i => i.category.id === catId)
    const picked = readingAllMode.value
      ? detectedAssetsAll.value[catId]
      : rfidDetectedAssets.value

    if (picked.length >= (item?.quantity||0)) continue

    for (const asset of assets) {
      if (!asset.tag) continue
      const tagClean = String(asset.tag).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

      // matching: exacto, inclusión, EPC final, etc.
      if (
        tagClean === cleanTag ||
        cleanTag.includes(tagClean) ||
        tagClean.includes(cleanTag) ||
        (cleanTag.slice(-24) === tagClean.slice(-24))
      ) {
        foundAsset = asset
        foundCatId  = catId
        break
      }
    }
    if (foundAsset) break
  }

  if (!foundAsset) return

  // 5) Agregar al array correspondiente evitando duplicados
  if (readingAllMode.value) {
    const arr = detectedAssetsAll.value[foundCatId]
    if (!arr.some(a => a.id === foundAsset.id)) {
      arr.push(foundAsset)
    }
  } else {
    if (!rfidDetectedAssets.value.some(a => a.id === foundAsset.id)) {
      rfidDetectedAssets.value.push(foundAsset)
    }
  }
}


    function removeDetectedAsset(assetId) {
      rfidDetectedAssets.value = rfidDetectedAssets.value.filter(a => a.id !== assetId)
    }

    // Nueva función: Encuentra los detalles de un activo asignado por su ID
      // Busca en currentCategoryAssets para obtener el objeto completo del activo.
      // Puedes refinar esto si tus assets disponibles no son siempre los mismos que los asignados
      // o si los detalles completos solo los tienes al momento de escanear.
      function findAssignedAssetDetails(assetId, categoryId) {
        // Primero, busca en los activos disponibles cargados para la categoría
        const assetsInCurrentCategory = currentCategoryAssets.value[categoryId] || [];
        const found = assetsInCurrentCategory.find(asset => asset.id === assetId);
        
        if (found) {
          return found;
        }
        
        // Si no se encuentra en currentCategoryAssets (quizás ya no está "disponible" después de asignarlo),
        // podrías buscarlo en rfidDetectedAssets (aunque estos se borran)
        // O podrías hacer una nueva consulta a la DB (más costoso)
        // Para simplificar, si el activo ya fue asignado, lo más lógico es que sus detalles ya los tenemos
        // del momento del escaneo, o que se hayan cargado al abrir el modal para la lista de "disponibles".
        
        // **OPCIONAL y más robusto:** Si necesitas cargar el detalle desde DB cada vez:
        // CUIDADO: Esto generaría una lectura por cada activo, podría ser costoso.
        // Se recomienda pre-cargar o usar los datos disponibles en `currentCategoryAssets`
        // o `rfidDetectedAssets` si el modal está activo.
        /*
        // Ejemplo de cómo harías una consulta si fuera necesario:
        // const assetDocRef = doc(db, 'businesses', businessId, 'tagsMovil', assetId);
        // const assetSnap = await getDoc(assetDocRef);
        // if (assetSnap.exists()) {
        //    return { id: assetSnap.id, ...assetSnap.data() };
        // }
        */
        
        return null; // Si no se encuentra el activo con detalles
      }

    // Verifica si un activo está actualmente en la lista de activos escaneados (rfidDetectedAssets)
    function isAssetCurrentlyDetected(assetId) {
        return rfidDetectedAssets.value.some(a => a.id === assetId);
      }
  
    // Nuevo: Función para ordenar los activos disponibles
    const sortedAvailableAssets = computed(() => (categoryId) => {
        const assets = currentCategoryAssets.value[categoryId] || [];
        // Clonar el array para no mutar el original
        const clonedAssets = [...assets];
  
        // Ordenar: seleccionados primero, luego por nombre
        return clonedAssets.sort((a, b) => {
          const aIsSelected = isAssetCurrentlyDetected(a.id);
          const bIsSelected = isAssetCurrentlyDetected(b.id);
  
          if (aIsSelected && !bIsSelected) return -1; // a va antes que b si a está seleccionado y b no
          if (!aIsSelected && bIsSelected) return 1;  // b va antes que a si b está seleccionado y a no
          
          // Si ambos están seleccionados o ninguno, ordenar por nombre
          // <<< MODIFICAR ESTE BLOQUE >>>
          const nameA = a.activo && a.activo.name ? a.activo.name : ''; // Accede de forma segura
          const nameB = b.activo && b.activo.name ? b.activo.name : ''; // Accede de forma segura

          return nameA.localeCompare(nameB);
        });
      });

      // Nuevo: Funciones para controlar el estado de despliegue de activos disponibles
      function toggleAvailableAssets(categoryId) {
        availableAssetsOpenState.value = {
          ...availableAssetsOpenState.value,
          [categoryId]: !availableAssetsOpenState.value[categoryId]
        };
      }
      
      function isAvailableAssetsOpen(categoryId) {
        return availableAssetsOpenState.value[categoryId] || false;
      }

    function isAssetSelected(assetId, categoryId) {
      // Esta función no es tan relevante si solo mostramos los rfidDetectedAssets
      // Pero si quisieras usarla para marcar activos en una lista de "disponibles", sería así:
      return rfidDetectedAssets.value.some(a => a.id === assetId) && activeCategoryId.value === categoryId;
    }

    async function assignAssetsToCategory(item, assetsList = null) {
      // 1) Decide el array que vamos a asignar
      const toAssign = assetsList ?? rfidDetectedAssets.value;

      // 2) Comprobación de cantidad
      if (toAssign.length !== item.quantity) {
        alert(
          `Debes escanear exactamente ${item.quantity} activos para '${item.categoryName}'. Actualmente tienes ${toAssign.length}.`
        );
        return;
      }

      const batch = writeBatch(db);

      // 3) Marcamos cada activo como 'Prestado'
      toAssign.forEach(asset => {
        const assetRef = doc(db, 'businesses', businessId, 'tagsMovil', asset.id);
        batch.update(assetRef, { status: 'Prestado' });
      });

      // 4) Preparamos la nueva versión de items en la orden
      const orderRef = doc(ordersCol, currentOrder.value.id);
      const updatedItems = currentOrder.value.items.map(i => {
        if (i.category.id === item.category.id) {
          return {
            ...i,
            completed: true,
            assignedAssets: toAssign.map(asset => ({
              id: asset.id,
              nombre: asset.activo.nombre,
              codigoInterno: asset.activo.codigoInterno,
              descripcion: asset.activo.descripcion,
              ubicacionId: asset.activo.ubicacion.code,
              rfid: asset.tag
            }))
          };
        }
        return i;
      });

      batch.update(orderRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });

      try {
        await batch.commit();

        // 5) Actualizamos el estado local
        currentOrder.value.items = updatedItems;

        // Limpiamos arrays y estados de lectura
        rfidDetectedAssets.value = [];
        if (assetsList) {
          // sólo si venías de "Leer Todo"
          detectedAssetsAll.value[item.category.id] = [];
          readingAllMode.value = false;
        }
        activeCategoryId.value = null;
        stopRFIDReading();

        alert(`${toAssign.length} activos asignados a ${item.categoryName} y marcados como 'Prestado'.`);
      } catch (error) {
        console.error("Error asignando activos:", error);
        alert("Error al asignar activos. Por favor, inténtalo de nuevo.");
      }
    }

    async function completePacking() {
      // Verificar si todas las categorías requeridas están completas
      const allItemsCompleted = currentOrder.value.items.every(item => item.completed);
      if (!allItemsCompleted) {
        alert('Aún quedan categorías por empacar. Por favor, asigna todos los equipos solicitados.');
        return;
      }

      try {
        // Actualizar estado de la orden a 'Empacada'
        const orderRef = doc(ordersCol, currentOrder.value.id)
        await updateDoc(orderRef, {
          status: 'Empacada',
          packedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        // Recargar órdenes para que se refleje el cambio de estado en la tabla principal
        await loadOrders()
        closePackingModal()
        alert('Orden marcada como empacada exitosamente.')
      } catch (error) {
        console.error("Error completando empacado:", error)
        alert("Error al completar el empacado. Por favor, inténtalo de nuevo.")
      }
    }

    async function loadOrders() {
      const snap = await getDocs(ordersCol)
      orders.value = snap.docs.map(d => {
        const data = d.data()
        // Spread document data first, then id to avoid overwriting
        return { ...data, id: d.id }
      }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); // Ordenar por fecha de creación descendente
      console.log("Ordenes cargadas:", orders.value)
    }

    function openCreateModal() {
      isEditing.value = false
      resetForm()
      showModal.value = true
      assignOrderNumber()
    }
    function openEditModal(order) {
        isEditing.value = true
        const orderToEdit = JSON.parse(JSON.stringify(order)); // Deep copy

        // Función auxiliar para convertir Timestamp a "YYYY-MM-DD"
        const convertTimestampToDateString = (timestamp) => {
          if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined) {
            // Es un objeto Timestamp de Firebase
            const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
            return date.toISOString().split('T')[0]; // Formato "YYYY-MM-DD"
          } else if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Ya es una cadena en el formato correcto
            return timestamp;
          }
          return ''; // Devuelve cadena vacía si no es una fecha válida o no está presente
        };

        // Asignar y convertir las fechas a formato de cadena
        orderToEdit.eventDate = convertTimestampToDateString(orderToEdit.eventDate);
        orderToEdit.deliveryDate = convertTimestampToDateString(orderToEdit.deliveryDate);
        orderToEdit.returnDate = convertTimestampToDateString(orderToEdit.returnDate);

        form.value = orderToEdit; // Asigna el objeto con las fechas ya convertidas

        // Asegurar que las sub-propiedades de requester y responsibles existen
        form.value.requester = form.value.requester || { name: '', position: '' };
        form.value.responsibles = form.value.responsibles || { packing: '', delivery: '', transport: '', return: '' };
        form.value.items = form.value.items || [];
        
        console.log("Valor del Form para editar (después de conversión):", form.value)
        showModal.value = true
      }
    function closeModal() {
      showModal.value = false
      resetForm() // Limpiar el formulario al cerrar para evitar datos residuales
    }

    function resetForm() {
      form.value = {
        id: null,
        number: '', requester: { name: '', position: '' }, eventType: '', eventName: '', address: '', city: '',
        eventDate: '', deliveryDate: '', returnDate: '',
        responsibles: { packing:'',delivery:'',transport:'',return:'' }, status:'Pedida', items: []
      }
    }

    // Auto-increment
    async function assignOrderNumber() {
      await runTransaction(db, async tx => {
        const counter = await tx.get(counterDoc)
        let next = 1
        if (counter.exists()) {
          next = counter.data().last + 1
          tx.update(counterDoc, { last: next })
        } else {
          tx.set(counterDoc, { last: next })
        }
        form.value.number = String(next).padStart(5, '0')
      })
    }

    function addItem() {
      form.value.items.push({ category: null, categoryName: '', quantity: 1, assignedAssets: [] }) // Añadir categoryName
    }
    function removeItem(i) {
      form.value.items.splice(i,1)
    }
    async function checkAvailability(item) {
      if (!item.category) return;
      const assetsCol = collection(db, 'businesses', businessId, 'tagsMovil');
      const q = query(assetsCol,
        where('activo.category.name', '==', item.category.name), // Usar item.category.name
        where('status', '==', 'Disponible')
      );
      const snap = await getDocs(q);
      const availableCount = snap.docs.length;
      if (item.quantity > availableCount) {
        alert(`Sólo hay ${availableCount} activos disponibles de la categoría '${item.category.name}'.`);
        item.quantity = availableCount > 0 ? availableCount : 1; // Ajustar cantidad o dejar en 1
      }
    }

    async function saveOrder() {
      const data = { ...form.value }
      // Asegurarse de que los campos de fecha estén en formato Date o string adecuado para Firebase
      data.eventDate = data.eventDate ? new Date(data.eventDate) : null;
      data.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null;
      data.returnDate = data.returnDate ? new Date(data.returnDate) : null;

      // Limpiar IDs temporales antes de guardar
      delete data.id;

      if (isEditing.value) {
        await updateDoc(doc(ordersCol, form.value.id), { ...data, updatedAt: serverTimestamp() })
      } else {
        const docRef = await addDoc(ordersCol, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        form.value.id = docRef.id
      }
      await loadOrders()
      closeModal()
      alert(`Orden ${isEditing.value ? 'actualizada' : 'creada'} exitosamente.`);
    }

    async function deleteOrder(id) {
      if (confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.')) {
        try {
          // Opcional: Revertir el estado de los activos asignados si la orden se elimina
          const orderToDelete = orders.value.find(order => order.id === id);
          if (orderToDelete && orderToDelete.items) {
            const batch = writeBatch(db);
            for (const item of orderToDelete.items) {
              if (item.assignedAssets && item.assignedAssets.length > 0) {
                for (const assetId of item.assignedAssets) {
                  const assetRef = doc(db, 'businesses', businessId, 'tagsMovil', assetId);
                  // Puedes decidir si los regresas a 'Disponible' o a un estado intermedio
                  batch.update(assetRef, { status: 'Disponible' });
                }
              }
            }
            await batch.commit();
            console.log("Estado de activos revertido al eliminar la orden.");
          }

          await deleteDoc(doc(ordersCol, id))
          await loadOrders()
          alert('Orden eliminada exitosamente.')
        } catch (error) {
          console.error("Error eliminando la orden o revirtiendo activos:", error);
          alert("Hubo un error al eliminar la orden. Por favor, inténtalo de nuevo.");
        }
      }
    }

    function formatDate(ts) {
        if (!ts) return '';
        let date;
        // Check if it's a Firestore Timestamp object
        if (ts.toDate) {
            date = ts.toDate();
        } else if (ts.seconds !== undefined && ts.nanoseconds !== undefined) {
            // If it's a plain object that looks like a Timestamp
            date = new Date(ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6));
        } else if (ts instanceof Date) {
            // If it's already a JavaScript Date object
            date = ts;
        } else if (typeof ts === 'string') {
            // If it's a date string, try to parse it
            date = new Date(ts);
        } else {
            return String(ts); // Fallback for unexpected types
        }

        // Check if the parsed date is valid
        if (isNaN(date.getTime())) {
            return String(ts); // Return original string if date is invalid
        }

        // Format the date
        return date.toLocaleDateString('es-CO'); // Formato de fecha para Colombia
    }


    function onCategoryChange(item) {
      const found = categories.value.find(c => c.name === item.categoryName)
      if (found) {
          item.category = { id: found.id, name: found.name }; // Guardar id y nombre de la categoría
          checkAvailability(item);
      } else {
          item.category = null;
          item.categoryName = ''; // Limpiar el nombre si no se encuentra
          alert('Categoría no encontrada. Por favor, selecciona una categoría válida de la lista.');
      }
    }

    // Filtrar órdenes por pestaña activa
    const filteredOrders = computed(() => {
        if (!orders.value) return []; // Si no hay órdenes, devuelve un array vacío

        return orders.value.filter(order => {
          // Primero, aplicar el filtro de búsqueda general
          const matchesSearch = order.number.includes(searchQuery.value) ||
                                (order.eventName && order.eventName.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
                                (order.requester.name && order.requester.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
          
          // Luego, aplicar el filtro por la pestaña activa
          let matchesTab = false;
          // ¡CAMBIAR currentTab.value A activeTab.value EN ESTE BLOQUE!
          if (activeTab.value === 'Pedida') { // Corregido: 'Pedida' con P mayúscula para consistencia
            matchesTab = order.status === 'Pedida';
          } else if (activeTab.value === 'Empacada') { // Corregido: 'Empacada' con E mayúscula
            matchesTab = order.status === 'Empacada';
          } else if (activeTab.value === 'Despachada') { // Corregido: 'Despachada' con D mayúscula
            matchesTab = order.status === 'Despachada';
          } else if (activeTab.value === 'Entregada') { // Corregido: 'Entregada' con E mayúscula
            matchesTab = order.status === 'Entregado'; // Tu estado en DB es 'Entregado', no 'Entregada'
          } else if (activeTab.value === 'Retornada') { // Añadido: 'Retornada'
            matchesTab = order.status === 'Retornada';
          }
          // Si el activeTab no coincide con ninguna condición, no mostrar nada de esta orden.

          return matchesSearch && matchesTab; // La orden debe coincidir con la búsqueda Y con la pestaña
        });
      });

    // Asegurarse de detener la lectura RFID si el componente se desmonta inesperadamente
      watch(showPackingModal, val => {
        if (!val && readingAllMode.value) {
          stopRFIDReading()
          readingAllMode.value = false
        }
      })

    function openPackedOrderModal(order) {
        currentPackedOrder.value = JSON.parse(JSON.stringify(order)); // Deep copy de la orden

        // Asegúrate de que los arrays existan para evitar errores si la data es inconsistente
        currentPackedOrder.value.items = currentPackedOrder.value.items || [];
        currentPackedOrder.value.items.forEach(item => {
          item.assignedAssets = item.assignedAssets || [];
        });

        // Reiniciar y/o pre-llenar los formularios de Despacho y Entrega
        // Inicializar dispatchForm y deliveryForm con datos de la orden si existen
        dispatchForm.value = {
          notes: currentPackedOrder.value.dispatch?.notes || '',
          deliveryResponsible: currentPackedOrder.value.dispatch?.deliveryResponsible || '',
          // Las fechas y horas deben ser tratadas si vienen como Timestamps o de otro formato
          dispatchDate: currentPackedOrder.value.dispatch?.dispatchDate || '', 
          dispatchTime: currentPackedOrder.value.dispatch?.dispatchTime || '',
          receiveResponsible: currentPackedOrder.value.dispatch?.receiveResponsible || ''
        };
        // Para deliveryDate en dispatchForm, si viene como Timestamp:
        if (currentPackedOrder.value.dispatch?.dispatchDate && typeof currentPackedOrder.value.dispatch.dispatchDate === 'object' && currentPackedOrder.value.dispatch.dispatchDate.seconds !== undefined) {
          dispatchForm.value.dispatchDate = formatDate(currentPackedOrder.value.dispatch.dispatchDate);
        }

        deliveryForm.value = {
          deliveryResponsible: currentPackedOrder.value.delivery?.deliveryResponsible || '',
          receivedBy: currentPackedOrder.value.delivery?.receivedBy || '',
          actualDeliveryDate: currentPackedOrder.value.delivery?.actualDeliveryDate || '',
          actualDeliveryTime: currentPackedOrder.value.delivery?.actualDeliveryTime || ''
        };
        // Para actualDeliveryDate en deliveryForm, si viene como Timestamp:
        if (currentPackedOrder.value.delivery?.actualDeliveryDate && typeof currentPackedOrder.value.delivery.actualDeliveryDate === 'object' && currentPackedOrder.value.delivery.actualDeliveryDate.seconds !== undefined) {
          deliveryForm.value.actualDeliveryDate = formatDate(currentPackedOrder.value.delivery.actualDeliveryDate);
        }

        // Reiniciar filtros de tabla de activos al abrir
        assetSearchQuery.value = '';
        sortBy.value = 'categoryName';
        sortDirection.value = 'asc';

        showPackedOrderModal.value = true;
      }

      function closePackedOrderModal() {
        showPackedOrderModal.value = false;
        currentPackedOrder.value = null;
        assetSearchQuery.value = ''; // Limpiar búsqueda
      }

      function printPackedOrder() {
        // Asegúrate de que el modal esté abierto y 'currentPackedOrder' tenga datos
        if (!currentPackedOrder.value) {
          console.error("No hay una orden empacada activa para imprimir.");
          alert("No se pudo preparar el documento para imprimir. Por favor, intente de nuevo.");
          return;
        }

        // Selecciona el contenido que quieres imprimir.
        // Es mejor seleccionar un contenedor que englobe toda la sección imprimible,
        // incluyendo la información básica y la tabla.
        const printContentElement = document.querySelector('.modal-body'); 
        if (!printContentElement) {
          console.error("Elemento de contenido de impresión no encontrado.");
          alert("No se pudo encontrar el contenido para imprimir.");
          return;
        }

        const contentToPrint = printContentElement.innerHTML;

        // Construir el HTML completo para la nueva ventana de impresión
        // Incluye los estilos de Bootstrap y los estilos personalizados si los tienes.
        // Es CRUCIAL incluir los mismos CSS que tu aplicación usa para que la impresión se vea bien.
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Imprimir Listado de Pedido</title>');
        // Incluye el CSS de Bootstrap. Asegúrate que la ruta sea correcta.
        // Si usas un CDN:
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">');
        // Si tienes tus propios estilos globales o específicos del componente, inclúyelos también.
        // Por ejemplo, si tienes un archivo style.css:
        // printWindow.document.write('<link href="/path/to/your/style.css" rel="stylesheet">');
        // O si tienes estilos scoped que son importantes para la impresión (menos común):
        // Tendrías que copiar los estilos de <style scoped> aquí manualmente o a un archivo CSS.
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h3 class="text-center my-3">Listado de Activos - Pedido #'+ currentPackedOrder.value.number +'</h3>');
        printWindow.document.write('<div class="container-fluid p-4">'); // Añade un contenedor para padding en la impresión
        printWindow.document.write(contentToPrint); // Inserta el HTML del modal-body
        printWindow.document.write('</div></body></html>');
        printWindow.document.close();

        // Esperar un poco para que los estilos se carguen (opcional pero recomendado)
        // Puedes ajustar este setTimeout o usar un evento 'onload' del printWindow
        setTimeout(() => {
          printWindow.print();
          // Cierra la ventana después de la impresión, si lo deseas
          // printWindow.close(); // Comentar si quieres que el usuario cierre la ventana manualmente
        }, 500); // 500ms deberían ser suficientes en la mayoría de los casos
      }

      // Obtiene el nombre de la ubicación por su ID
      const getLocationName = (locationId) => {
        const loc = locations.value.find(l => l.id === locationId);
        return loc ? loc.name : 'N/A'; // 'N/A' si no se encuentra
      };

      // Obtiene el nombre de la categoría de un activo asignado.
      // Los activos asignados no tienen el nombre de categoría directamente en `asset.activo.category.name`
      // porque solo guardamos el ID en `assignedAssets` de la orden, así que lo buscamos en el item padre.
      const getCategoryNameForItem = (assetId) => {
        if (!currentPackedOrder.value || !currentPackedOrder.value.items) return '';
        for (const item of currentPackedOrder.value.items) {
          if (item.assignedAssets && item.assignedAssets.some(a => a.id === assetId)) {
            return item.categoryName; // Retorna el nombre de la categoría del ítem principal
          }
        }
        return 'Categoría Desconocida';
      };

      // Computed property para aplanar todos los activos asignados de la orden completa
      const allAssignedAssets = computed(() => {
        if (!currentPackedOrder.value || !currentPackedOrder.value.items) return [];
        let assets = [];
        currentPackedOrder.value.items.forEach(item => {
          if (item.assignedAssets && item.assignedAssets.length > 0) {
            // Añadir el nombre de la categoría a cada activo para facilitar el ordenamiento
            item.assignedAssets.forEach(asset => {
                assets.push({ ...asset, categoryName: item.categoryName });
            });
          }
        });
        return assets;
      });

      // Computed property para el total de activos solicitados en la orden (útil para la cabecera)
      const totalAssetsInOrder = computed(() => {
        if (!currentPackedOrder.value || !currentPackedOrder.value.items) return 0;
        return currentPackedOrder.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      });

      // Computed property que aplica el filtrado y el ordenamiento a los activos asignados
      const filteredAssignedAssets = computed(() => {
        let assets = [...allAssignedAssets.value]; // Crear una copia mutable

        // 1. Aplicar búsqueda/filtro
        if (assetSearchQuery.value) {
          const query = assetSearchQuery.value.toLowerCase();
          assets = assets.filter(asset =>
            (asset.nombre && asset.nombre.toLowerCase().includes(query)) ||
            (asset.codigoInterno && asset.codigoInterno.toLowerCase().includes(query)) ||
            (asset.rfid && asset.rfid.toLowerCase().includes(query)) ||
            (asset.descripcion && asset.descripcion.toLowerCase().includes(query)) ||
            (asset.categoryName && asset.categoryName.toLowerCase().includes(query)) || // Buscar también por categoría
            (getLocationName(asset.ubicacionId) && getLocationName(asset.ubicacionId).toLowerCase().includes(query)) // Buscar por nombre de ubicación
          );
        }

        // 2. Aplicar ordenamiento
        if (sortBy.value) {
          assets.sort((a, b) => {
            let valA, valB;

            // Manejo especial para la ubicación si quieres ordenar por su nombre
            if (sortBy.value === 'ubicacionId') {
              valA = getLocationName(a.ubicacionId);
              valB = getLocationName(b.ubicacionId);
            } else {
              valA = a[sortBy.value];
              valB = b[sortBy.value];
            }
            
            // Asegúrate de que los valores sean cadenas para localeCompare
            valA = valA === null || valA === undefined ? '' : String(valA);
            valB = valB === null || valB === undefined ? '' : String(valB);

            if (sortDirection.value === 'asc') {
              return valA.localeCompare(valB);
            } else {
              return valB.localeCompare(valA);
            }
          });
        }
        return assets;
      });

      // Funciones para controlar el ordenamiento de la tabla
      const setSort = (field) => {
        if (sortBy.value === field) {
          sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
          sortBy.value = field;
          sortDirection.value = 'asc';
        }
      };

      const getSortIcon = (field) => {
        if (sortBy.value === field) {
          return sortDirection.value === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'; // Requiere Bootstrap Icons
        }
        return 'bi bi-arrow-down-up'; // Icono por defecto (no ordenado)
      };

      const resetAssetFilters = () => {
        assetSearchQuery.value = '';
        sortBy.value = 'categoryName';
        sortDirection.value = 'asc';
      };

      async function markOrderAsDispatched() {
        if (!currentPackedOrder.value || currentPackedOrder.value.status !== 'Empacada') {
          alert('Esta orden no está en el estado correcto para ser despachada.');
          return;
        }

        console.log("currentPackedOrder.value:", currentPackedOrder.value);

        // Validaciones básicas
        if (!dispatchForm.value.deliveryResponsible || !dispatchForm.value.dispatchDate || !dispatchForm.value.dispatchTime || !dispatchForm.value.receiveResponsible) {
          alert('Por favor, complete todos los campos de Despacho (Responsable Entrega, Fecha, Hora, Responsable Recibe).');
          return;
        }

        const orderRef = doc(ordersCol, currentPackedOrder.value.id);
        
        // Convertir la fecha de despacho a un objeto Date (o Timestamp si lo prefieres consistentemente)
        // Guardaremos la fecha como string "YYYY-MM-DD" para consistencia con input type="date" y Timestamp en DB
        const fullDispatchDateTime = new Date(`${dispatchForm.value.dispatchDate}T${dispatchForm.value.dispatchTime}`);
        const dispatchTimestamp = Timestamp.fromDate(fullDispatchDateTime); // Convertir a Timestamp para guardar en DB

        try {
          await updateDoc(orderRef, {
            status: 'Despachada',
            dispatch: {
              notes: dispatchForm.value.notes,
              deliveryResponsible: dispatchForm.value.deliveryResponsible,
              dispatchDate: dispatchForm.value.dispatchDate, // Guardar como string YYYY-MM-DD
              dispatchTime: dispatchForm.value.dispatchTime,
              receiveResponsible: dispatchForm.value.receiveResponsible,
              timestamp: dispatchTimestamp // Guardar también el Timestamp si lo necesitas para cálculos futuros
            },
            updatedAt: serverTimestamp()
          });

          // Actualizar el estado local
          currentPackedOrder.value.status = 'Despachada';
          currentPackedOrder.value.dispatch = {
            notes: dispatchForm.value.notes,
            deliveryResponsible: dispatchForm.value.deliveryResponsible,
            dispatchDate: dispatchForm.value.dispatchDate,
            dispatchTime: dispatchForm.value.dispatchTime,
            receiveResponsible: dispatchForm.value.receiveResponsible,
            timestamp: dispatchTimestamp
          };
          
          alert('Pedido marcado como DESPACHADO exitosamente.');
          // Puedes cerrar el modal o dejarlo abierto para ver la información actualizada
          // closePackedOrderModal();
        } catch (error) {
          console.error("Error al marcar pedido como despachado:", error);
          alert("Error al despachar el pedido. Inténtalo de nuevo.");
        }
      }

      async function markOrderAsDelivered() {
        if (!currentPackedOrder.value || currentPackedOrder.value.status !== 'Despachada') {
          alert('Esta orden no está en el estado correcto para ser entregada.');
          return;
        }

        // Validaciones básicas
        if (!deliveryForm.value.deliveryResponsible || !deliveryForm.value.receivedBy || !deliveryForm.value.actualDeliveryDate || !deliveryForm.value.actualDeliveryTime) {
          alert('Por favor, complete todos los campos de Entrega (Responsable Entrega, Persona que Recibe, Fecha, Hora).');
          return;
        }

        const orderRef = doc(ordersCol, currentPackedOrder.value.id);
        
        const fullDeliveryDateTime = new Date(`${deliveryForm.value.actualDeliveryDate}T${deliveryForm.value.actualDeliveryTime}`);
        const deliveryTimestamp = Timestamp.fromDate(fullDeliveryDateTime);

        try {
          await updateDoc(orderRef, {
            status: 'Entregado',
            delivery: {
              deliveryResponsible: deliveryForm.value.deliveryResponsible,
              receivedBy: deliveryForm.value.receivedBy,
              actualDeliveryDate: deliveryForm.value.actualDeliveryDate, // Guardar como string YYYY-MM-DD
              actualDeliveryTime: deliveryForm.value.actualDeliveryTime,
              timestamp: deliveryTimestamp // Guardar también el Timestamp
            },
            updatedAt: serverTimestamp()
          });

          // Actualizar el estado local
          currentPackedOrder.value.status = 'Entregado';
          currentPackedOrder.value.delivery = {
            deliveryResponsible: deliveryForm.value.deliveryResponsible,
            receivedBy: deliveryForm.value.receivedBy,
            actualDeliveryDate: deliveryForm.value.actualDeliveryDate,
            actualDeliveryTime: deliveryForm.value.actualDeliveryTime,
            timestamp: deliveryTimestamp
          };

          alert('Pedido marcado como ENTREGADO exitosamente.');
          // Puedes cerrar el modal o dejarlo abierto
          // closePackedOrderModal();
        } catch (error) {
          console.error("Error al marcar pedido como entregado:", error);
          alert("Error al entregar el pedido. Inténtalo de nuevo.");
        }
      }

        // —————————— lógica al seleccionar un grupo ——————————
    function onGroupSelect() {
      if (!selectedGroup.value) return

      selectedGroup.value.categoryIds.forEach(catId => {
        const cat = categories.value.find(c => c.id === catId)
        if (!cat) return
        // ¿ya existe en form.items?
        const existing = form.value.items.find(i => i.category?.id === cat.id)
        if (existing) {
          // incrementa la cantidad
          existing.quantity++
        } else {
          // lo agrega con cantidad =1
          form.value.items.push({
            category: { id: cat.id, name: cat.name },
            categoryName: cat.name,
            quantity: 1,
            assignedAssets: []
          })
        }
      })

      // volver a dejar el dropdown en blanco
      selectedGroup.value = null
    }

    function clearGroupSelection() {
      selectedGroup.value = null
    }

    async function readAll() {
      // 1) Cargar todos los assets “Disponibles” de cada categoría en la orden
      const map = {}
      for (const item of currentOrder.value.items) {
        const snap = await getDocs(query(
          collection(db, 'businesses', businessId, 'tagsMovil'),
          where('activo.category.name', '==', item.categoryName),
          where('status', '==', 'Disponible')
        ))
        map[item.category.id] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }
      loadedAssetsAll.value = map

      // 2) Inicializar detectados por categoría
      detectedAssetsAll.value = {}
      Object.keys(map).forEach(catId => {
        detectedAssetsAll.value[catId] = []
      })

      // 3) Activar modo “lectura masiva”
      readingAllMode.value = true
      startRFIDReading()
    }

    function stopBulkRead() {
      stopRFIDReading()
      readingAllMode.value = false
    }
        // Comprueba que para cada categoría ya has detectado la cantidad esperada
    const isAllDetected = computed(() => {
      return currentOrder.value.items.every(item => {
        const arr = detectedAssetsAll.value[item.category.id] || []
        return arr.length === item.quantity
      })
    })
    // Método que llama a tu assignAssetsToCategory por cada categoría
    function assignAllBulk() {
      currentOrder.value.items.forEach(item => {
        const arr = detectedAssetsAll.value[item.category.id] || []
        if (arr.length === item.quantity) {
          assignAssetsToCategory(item, arr)
        }
      })
      // una vez que asignes todo, limpias el modo bulk
      stopBulkRead()
    }

    return {
      orders, categories, form, showModal, isEditing,
      openCreateModal, openEditModal, closeModal,
      addItem, removeItem, checkAvailability,
      saveOrder, deleteOrder, formatDate, onCategoryChange,
      statusTabs, activeTab, filteredOrders,
      openPackingModal, showPackingModal, closePackingModal,
      currentOrder, currentCategoryAssets, rfidReadingActive,
      rfidDetectedAssets, activeCategoryId, isAssetSelected,
      processRFIDTag, removeDetectedAsset,
      isPackingComplete, loadAssetsForCategory, completePacking,
      stopRFIDReading, assignAssetsToCategory, handleClickLoadAssets,
      sortedAvailableAssets, toggleAvailableAssets, isAvailableAssetsOpen,
      isAssetCurrentlyDetected, findAssignedAssetDetails,
      showPackedOrderModal,
    currentPackedOrder,
    openPackedOrderModal,
    closePackedOrderModal,
    printPackedOrder,
    assetSearchQuery,
    filteredAssignedAssets,
    setSort,
    getSortIcon,
    getLocationName,
    getCategoryNameForItem, // Asegúrate de retornar esta
    resetAssetFilters,
    totalAssetsInOrder,
    locations, // Retorna locations si la usas en el template para debug o algo
    dispatchForm,
    deliveryForm,
    markOrderAsDispatched,
    markOrderAsDelivered,
    rfidVerificados,
    handleRFIDVerificacion,
    groups,
    selectedGroup,
    onGroupSelect,
    clearGroupSelection,
    form,
    categories,
    readingAllMode,
    readAll,
    detectedAssetsAll,
    isAllDetected,
    assignAllBulk,
    searchQuery // <--- Asegúrate de que esta línea exista
    }
  } 
}
    // Función requerida por la pistola para recibir tags
    // Después:
      window.appendTag = function (raw) {
        try {
          const data = JSON.parse(raw)
          const tag = data.tag?.toUpperCase?.().trim()

          if (!tag) {
            console.warn("⚠️ Tag vacío o inválido:", raw)
            return
          }

          // Si estamos en el modal de empacado, procesamos con tu lógica de lectura:
          window.processRFIDTag(tag)
        } catch (err) {
          console.error("❌ Error al parsear tag:", err, raw)
        }
      }

</script>
  
  <style scoped>
  .modal { overflow-y:auto; }
  .v-select { width:100%; }
   /* Puedes añadir estilos CSS personalizados aquí si es necesario */
   .list-group-item-success {
    background-color: #d1e7dd; /* Un verde claro para elementos seleccionados */
    border-color: #badbcc;
  }
  .btn-link {
    text-decoration: none; /* Elimina el subrayado por defecto del btn-link */
    color: #0d6efd; /* Color azul de Bootstrap primary */
  }
  .btn-link:hover {
    text-decoration: underline; /* Subrayar al pasar el mouse */
  }
  .sortable {
    cursor: pointer;
  }
  .sortable i {
    font-size: 0.8em; /* Ajusta el tamaño del icono de ordenamiento */
  }
  </style>
  