<script setup lang="ts">
const props = defineProps<{
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: 'process'): void;
  (e: 'close'): void;
}>();

function handleClick() {
  console.log('Button clicked'); // 添加日志
  emit('process');
  emit('close');
}
</script>

<template>
  <div 
    class="selection-button"
    :style="{
      left: x + 'px',
      top: y + 'px'
    }"
  >
    <button @click="handleClick">显示拼音</button>
  </div>
</template>

<style scoped>
.selection-button {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 4px;
}

button {
  border: none;
  background: #4a9eff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2186ff;
}
</style>
