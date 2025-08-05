<template>
  <div class="metric-card" :class="colorClass">
    <div class="metric-icon">
      <i :class="icon"></i>
    </div>
    <div class="metric-content">
      <h3 class="metric-value">{{ formattedValue }}</h3>
      <p class="metric-label">{{ label }}</p>
      <div v-if="subtitle" class="metric-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'primary'
  },
  format: {
    type: String,
    default: 'number' 
  }
})

const colorClass = computed(() => `metric-${props.color}`)

const formattedValue = computed(() => {
  if (props.format === 'currency') {
    return `$${Number(props.value).toLocaleString()}`
  } else if (props.format === 'percentage') {
    return `${Number(props.value).toFixed(1)}%`
  } else {
    return Number(props.value).toLocaleString()
  }
})
</script>

<style scoped>
.metric-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  margin-right: 1rem;
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.metric-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0.25rem 0 0 0;
  font-weight: 500;
}

.metric-subtitle {
  font-size: 0.8rem;
  color: #adb5bd;
  margin: 0.25rem 0 0 0;
}

/* Color variants */
.metric-primary {
  border-left-color: #007bff;
}

.metric-primary .metric-icon {
  background: linear-gradient(135deg, #007bff, #0056b3);
}

.metric-success {
  border-left-color: #28a745;
}

.metric-success .metric-icon {
  background: linear-gradient(135deg, #28a745, #1e7e34);
}

.metric-warning {
  border-left-color: #ffc107;
}

.metric-warning .metric-icon {
  background: linear-gradient(135deg, #ffc107, #e0a800);
}

.metric-info {
  border-left-color: #17a2b8;
}

.metric-info .metric-icon {
  background: linear-gradient(135deg, #17a2b8, #138496);
}

.metric-danger {
  border-left-color: #dc3545;
}

.metric-danger .metric-icon {
  background: linear-gradient(135deg, #dc3545, #c82333);
}

.metric-dark {
  border-left-color: #343a40;
}

.metric-dark .metric-icon {
  background: linear-gradient(135deg, #343a40, #212529);
}
</style> 