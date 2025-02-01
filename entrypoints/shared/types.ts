export interface PinyinConfig {
  toneType: "symbol" | "num" | "none";
  position: "above" | "right";
  toneColor: boolean;
  triggerMode: "hover" | "click" | "always";
  showPinyin: boolean;
  fontSize: string;
  opacity: number;
  processMode: "all" | "selection"; // 添加处理模式
  displayMode: "inline" | "float"; // 添加显示模式
  enableTTS?: boolean; // 添加TTS开关,可选
  autoProcess?: boolean; // 添加自动处理开关,可选
}

export const DEFAULT_CONFIG: PinyinConfig = {
  toneType: "symbol",
  position: "above",
  toneColor: true,
  triggerMode: "hover",
  showPinyin: true,
  fontSize: "0.8em",
  opacity: 0.9,
  processMode: "all", // 默认整页处理
  displayMode: "float", // 默认悬浮显示
  enableTTS: false, // 默认不启用TTS
  autoProcess: false, // 默认不自动处理
};
