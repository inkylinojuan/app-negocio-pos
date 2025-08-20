// eventBus.js
import { reactive } from 'vue';

const eventBus = reactive({
  events: {},
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },
  off(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  },
  emit(eventName, payload) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => callback(payload));
  }
});

export default eventBus;