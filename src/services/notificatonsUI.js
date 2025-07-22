import Toast from 'bootstrap/js/dist/toast';

export const showNotification = ({ title, message, type = 'info', duration = 5000 }) => {
  // Crear contenedor si no existe
  let container = document.getElementById('notifications-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notifications-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  // Crear elemento de notificación
  const toastEl = document.createElement('div');
  toastEl.className = `toast show align-items-center text-bg-${type} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}</strong>
        <div>${message}</div>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);
  
  // Inicializar toast de Bootstrap
  const toast = new Toast(toastEl, {
    autohide: true,
    delay: duration
  });
  toast.show();

  // Limpiar después de cerrar
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
};