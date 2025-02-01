<script lang="ts" setup>
import HelloWorld from "@/components/HelloWorld.vue";
import { ref, onMounted } from "vue";
import { PinyinConfig, DEFAULT_CONFIG } from "../shared/types";

const config = ref<PinyinConfig>({ ...DEFAULT_CONFIG });

// 加载配置
onMounted(async () => {
  const stored = await chrome.storage.sync.get();
  Object.assign(config.value, stored);
});

// 保存配置
function saveConfig() {
  chrome.storage.sync.set(config.value);
  chrome.runtime.sendMessage({ type: "UPDATE_CONFIG", config: config.value });
}
</script>

<template>
  <div class="settings-panel">
    <h2>拼音显示设置</h2>

    <div class="setting-item">
      <label>启用拼音</label>
      <input
        type="checkbox"
        v-model="config.showPinyin"
        @change="saveConfig"
      />
    </div>

    <div class="setting-item">
      <label>触发方式</label>
      <select
        v-model="config.triggerMode"
        @change="saveConfig"
      >
        <option value="hover">悬停</option>
        <option value="click">点击</option>
        <option value="always">始终显示</option>
      </select>
    </div>

    <!-- 其他设置项 -->
    <div class="setting-item">
      <label>声调显示</label>
      <select
        v-model="config.toneType"
        @change="saveConfig"
      >
        <option value="symbol">声调符号</option>
        <option value="num">数字</option>
      </select>
    </div>

    <div class="setting-item">
      <label>声调颜色</label>
      <input
        type="checkbox"
        v-model="config.toneColor"
        @change="saveConfig"
      />
    </div>

    <div class="setting-item">
      <label>字体大小</label>
      <input
        type="text"
        v-model="config.fontSize"
        @change="saveConfig"
      />
    </div>

    <div class="setting-item">
      <label>透明度</label>
      <input
        type="range"
        v-model="config.opacity"
        min="0"
        max="1"
        step="0.1"
        @change="saveConfig"
      />
    </div>

    <div class="setting-item">
      <label>启用朗读</label>
      <input type="checkbox" v-model="config.enableTTS" @change="saveConfig">
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #54bc4ae0);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.settings-panel {
  padding: 20px;
  width: 300px;
}

.setting-item {
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ...existing styles... */
</style>
