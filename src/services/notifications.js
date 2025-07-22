import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { showNotification } from './notificatonsUI'; // Asumiremos que creamos este archivo

export const setupOrderNotifications = (callback) => {
  const businessId = localStorage.getItem('businessId') || ''
  const db = getFirestore();

  if (!businessId) {
    console.error('Business ID no disponible');
    return;
  }

  const ordersRef = collection(db, 'businesses', businessId, 'orders');
  const q = query(
    ordersRef,
    where('status', 'in', ['pending', 'preparing', 'ready'])
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const orderData = change.doc.data();
      const orderId = change.doc.id;
      const shortId = getShortCode(orderId, 4);

      switch(change.type) {
        case 'added':
          showNotification({
            title: 'Nuevo pedido recibido',
            message: `Pedido #${shortId}`,
            type: 'success'
          });
          callback({ type: 'new-order', data: { id: orderId, ...orderData } });
          break;

        case 'modified':
          const statusMessage = getStatusMessage(orderData.status);
          showNotification({
            title: 'Estado actualizado',
            message: `Pedido #${shortId}: ${statusMessage}`,
            type: 'info'
          });
          callback({ type: 'status-changed', orderId: orderId, data: { status: orderData.status } });
          break;

        case 'removed':
          // Manejar eliminación si es necesario
          break;
      }
    });
  });
};

// Helper function
function getStatusMessage(status) {
  const statusMap = {
    pending: 'Pendiente',
    preparing: 'En preparación',
    ready: 'Listo para entregar',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };
  return statusMap[status] || status;
}

function getShortCode(id, length = 4) {
  if (typeof id !== 'string') return ''
  let hash = 5381
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i)
  }
  const unsigned = hash >>> 0
  const max = 10 ** length
  return (unsigned % max).toString().padStart(length, '0')
}
