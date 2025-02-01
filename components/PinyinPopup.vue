<script setup lang="ts">
import { computed } from 'vue';
import { PinyinConfig } from '../shared/types';

const props = defineProps<{
  text: string;
  pinyin: string[];
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  config: PinyinConfig;
}>();

const style = computed(() => {
  const { top, left, width, height } = props.position;
  const { position } = props.config;
  
  // 计算可用空间
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const spaceAbove = top;
  const spaceBelow = viewportHeight - (top + height);
  const spaceLeft = left;
  const spaceRight = viewportWidth - (left + width);

  // 根据position和可用空间确定最终位置
  let finalPosition = position;
  
  if (position === 'above' && spaceAbove < 30) {
    finalPosition = 'right';
  }
  if (position === 'right' && spaceRight < 100) {
    finalPosition = 'above';
  }

  const positionStyle = finalPosition === 'above' 
    ? {
        bottom: `${window.innerHeight - top}px`,
        left: `${left}px`,
        width: `${width}px`,
      }
    : {
        top: `${top}px`,
        left: `${left + width + 5}px`,
        minWidth: '100px',
      };

  return {
    position: 'fixed',
    ...positionStyle
  };
});
</script>

<template>
  <div 
    class="pinyin-popup"
    :class="config.position"
    :style="style"
  >
    {{ pinyin.join(' ') }}
  </div>
</template>

<style scoped>
.pinyin-popup {
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 14px;
  color: #666;
  z-index: 9999;
}

.pinyin-popup.above {
  text-align: center;
  transform: translateY(-100%);
}

.pinyin-popup.right {
  text-align: left;
}
</style>
