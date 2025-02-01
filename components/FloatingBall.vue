<script setup lang="ts">
import { ref } from "vue";
import { PinyinConfig } from "../shared/types";

const props = defineProps<{
  config: PinyinConfig;
}>();

const emit = defineEmits<{
  (e: "update:config", value: PinyinConfig): void;
}>();

const isExpanded = ref(false);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function setTriggerMode(mode: PinyinConfig["triggerMode"]) {
  emit("update:config", {
    ...props.config,
    triggerMode: mode,
  });
  isExpanded.value = false;
}

function toggleProcess() {
  if (props.config.processMode === "selection") {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      emit("process", selection.getRangeAt(0));
    }
  } else {
    emit("process", document.body);
  }
}

function toggleProcessMode(mode: PinyinConfig["processMode"]) {
  emit("update:config", {
    ...props.config,
    processMode: mode,
  });
}

function togglePosition(position: PinyinConfig["position"]) {
  emit("update:config", {
    ...props.config,
    position,
  });
}

function toggleDisplayMode(mode: PinyinConfig["displayMode"]) {
  emit("update:config", {
    ...props.config,
    displayMode: mode
  });
}
</script>

<template>
  <div
    class="floating-ball"
    :class="{ expanded: isExpanded }"
  >
    <button
      class="main-button"
      @click="toggleExpand"
    >
      拼音
    </button>
    <div
      class="menu"
      v-show="isExpanded"
    >
      <div class="menu-section">
        <span class="section-title">触发方式</span>
        <button
          v-for="mode in ['hover', 'click', 'always']"
          :key="mode"
          :class="{ active: config.triggerMode === mode }"
          @click="setTriggerMode(mode)"
        >
          {{
            {
              hover: "悬停",
              click: "点击",
              always: "始终",
            }[mode]
          }}
        </button>
      </div>

      <div class="menu-section">
        <span class="section-title">处理范围</span>
        <button
          v-for="mode in ['all', 'selection']"
          :key="mode"
          :class="{ active: config.processMode === mode }"
          @click="toggleProcessMode(mode)"
        >
          {{
            {
              all: "整页处理",
              selection: "选中处理",
            }[mode]
          }}
        </button>
      </div>

      <div class="menu-section">
        <span class="section-title">音标位置</span>
        <button
          v-for="pos in ['above', 'right']"
          :key="pos"
          :class="{ active: config.position === pos }"
          @click="togglePosition(pos)"
        >
          {{
            {
              above: "上方",
              right: "右侧",
            }[pos]
          }}
        </button>
      </div>

      <div class="menu-section">
        <span class="section-title">显示模式</span>
        <button
          v-for="mode in ['inline', 'float']"
          :key="mode"
          :class="{ active: config.displayMode === mode }"
          @click="toggleDisplayMode(mode)"
        >
          {{
            {
              inline: '原文显示',
              float: '悬浮显示'
            }[mode]
          }}
        </button>
      </div>

      <button
        class="process-btn"
        @click="toggleProcess"
      >
        {{ config.processMode === "all" ? "处理整页" : "处理选中" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.floating-ball {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
}

.main-button {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: #4a9eff;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.main-button:hover {
  transform: scale(1.1);
}

.menu {
  position: absolute;
  bottom: 60px;
  right: 0;
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu button {
  min-width: 80px;
  padding: 8px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
}

.menu button.active {
  background: #4a9eff;
  color: white;
}

.menu-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.section-title {
  display: block;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 4px;
  width: 100%; /* 让标题占满一行 */
}

.process-btn {
  margin-top: 8px;
  background: #4a9eff;
  color: white;
  width: 100%;
}

.menu button.process-btn {
  margin-top: 8px;
  background: #4a9eff !important;
  color: white;
  width: 100%;
}
</style>
