import { pinyin } from "pinyin-pro";
import { createApp } from "vue";
import FloatingBall from "@/components/FloatingBall.vue";
import { PinyinConfig, DEFAULT_CONFIG } from "@/entrypoints/shared/types";
import SelectionButton from "@/components/SelectionButton.vue";
import PinyinPopup from "@/components/PinyinPopup.vue";

export default defineContentScript({
  matches: ["*://*/*"],  // 修改为匹配所有网页
  main() {
    console.log("Hello content.");
    // 声调颜色映射
    const TONE_COLORS: { [key: string]: string } = {
      "1": "#FF6B6B", // 红色 - 一声
      "2": "#4ECDC4", // 青色 - 二声
      "3": "#45B7D1", // 蓝色 - 三声
      "4": "#96CEB4", // 绿色 - 四声
    };

    // 优化TTS播放逻辑
    let currentUtterance: SpeechSynthesisUtterance | null = null;

    // 添加TTS功能
    function speak(text: string, config: PinyinConfig) {
      if (!config.enableTTS) return; // 检查是否启用TTS

      // 取消之前的播放
      if (currentUtterance) {
        window.speechSynthesis.cancel();
      }

      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.lang = "zh-CN";

      // 处理播放结束
      currentUtterance.onend = () => {
        currentUtterance = null;
      };

      window.speechSynthesis.speak(currentUtterance);
    }

    // 记录当前的SelectionButton实例
    let currentSelectionButton: {
      app: ReturnType<typeof createApp>;
      container: HTMLElement;
    } | null = null;

    // 添加当前的PinyinPopup实例跟踪
    let currentPinyinPopup: {
      app: ReturnType<typeof createApp>;
      container: HTMLElement;
    } | null = null;

    // 核心函数：将文本节点替换为带拼音的 Ruby 标签
    function convertTextToPinyin(
      node: Text,
      config: PinyinConfig,
      isSelection = false
    ) {
      const text = node.textContent || "";

      // 跳过非汉字内容
      if (!/[\u4e00-\u9fa5]/.test(text)) return;

      // 修正pinyin调用
      const pinyinResult = pinyin(text, {
        toneType: config.toneType,
        multiple: true, // 保留多音字选项
        type: "array",
      });

      // 创建 Ruby 标签
      const ruby = document.createElement("ruby");
      const rt = document.createElement("rt");
      rt.style.cssText = getPinyinStyle(config);

      // 划词触发的情况下直接显示拼音
      if (isSelection) {
        rt.textContent = pinyinResult.join(" ");
      } else if (config.triggerMode === "hover") {
        ruby.addEventListener("mouseenter", () => {
          rt.textContent = pinyinResult.join(" ");
          speak(text, config);
        });
        ruby.addEventListener("mouseleave", () => {
          rt.textContent = "";
        });
      } else if (config.triggerMode === "click") {
        ruby.addEventListener("click", () => {
          rt.textContent = pinyinResult.join(" ");
          speak(text, config);
        });
      } else {
        rt.textContent = pinyinResult.join(" ");
      }

      ruby.textContent = text;
      ruby.appendChild(rt);
      node.parentNode?.replaceChild(ruby, node);
    }

    // 获取拼音样式
    function getPinyinStyle(config: PinyinConfig): string {
      return `
        font-size: ${config.fontSize};
        opacity: ${config.opacity};
        color: ${config.toneColor ? TONE_COLORS["1"] : "#666"};
        display: ${config.showPinyin ? "block" : "none"};
      `;
    }

    // 优化处理函数
    function processElement(element: HTMLElement, config: PinyinConfig) {
      // 扩展跳过的标签
      const skipTags = [
        "SCRIPT",
        "STYLE",
        "INPUT",
        "TEXTAREA",
        "CODE",
        "PRE",
        "IFRAME",
        "SVG",
        "VIDEO",
      ];
      if (skipTags.includes(element.tagName)) return;

      // 跳过隐藏元素
      if (element.offsetParent === null) return;

      // 批量处理子节点,使用requestAnimationFrame避免阻塞
      const nodes = Array.from(element.childNodes);
      let index = 0;

      function processNextBatch() {
        const startTime = Date.now();

        while (index < nodes.length) {
          const node = nodes[index++];

          if (node.nodeType === Node.TEXT_NODE) {
            convertTextToPinyin(node as Text, config);
          } else if (node instanceof HTMLElement) {
            processElement(node, config);
          }

          // 如果处理时间超过16ms(一帧),暂停处理剩余节点
          if (Date.now() - startTime > 16) {
            requestAnimationFrame(processNextBatch);
            return;
          }
        }
      }

      requestAnimationFrame(processNextBatch);
    }

    // 修改processRange函数
    function processRange(range: Range, config: PinyinConfig) {
      const text = range.toString().trim();
      if (!text || !/[\u4e00-\u9fa5]/.test(text)) return;

      // 根据显示模式决定处理方式
      if (config.displayMode === "inline") {
        // 原页面显示方式
        const container = range.commonAncestorContainer;
        if (container instanceof Text) {
          convertTextToPinyin(container, config, true);
        } else if (container instanceof HTMLElement) {
          const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                return range.intersectsNode(node)
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            }
          );

          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node instanceof Text) {
              convertTextToPinyin(node, config, true);
            }
          }
        }
      } else {
        // 悬浮显示方式
        // 移除之前的popup
        if (currentPinyinPopup) {
          currentPinyinPopup.app.unmount();
          currentPinyinPopup.container.remove();
          currentPinyinPopup = null;
        }

        const pinyinResult = pinyin(text, {
          toneType: config.toneType,
          multiple: true,
          type: "array",
        });

        const rect = range.getBoundingClientRect();
        const scrollX =
          window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY =
          window.pageYOffset || document.documentElement.scrollTop;

        const container = document.createElement("div");
        document.body.appendChild(container);

        const app = createApp(PinyinPopup, {
          text,
          pinyin: pinyinResult,
          position: {
            top: rect.top + scrollY,
            left: rect.left + scrollX,
            width: rect.width,
            height: rect.height,
          },
          config,
        });

        app.mount(container);
        currentPinyinPopup = { app, container };

        // 监听选择变化以移除popup
        const selectionChangeHandler = () => {
          if (currentPinyinPopup) {
            currentPinyinPopup.app.unmount();
            currentPinyinPopup.container.remove();
            currentPinyinPopup = null;
          }
          document.removeEventListener(
            "selectionchange",
            selectionChangeHandler
          );
        };

        document.addEventListener("selectionchange", selectionChangeHandler);
      }
    }

    // 监听 DOM 变化
    function observeDOMChanges(config: PinyinConfig) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              convertTextToPinyin(node as Text, config);
            } else if (node instanceof HTMLElement) {
              processElement(node, config);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // 创建悬浮球
    function createFloatingBall(config: PinyinConfig) {
      const container = document.createElement("div");
      document.body.appendChild(container);

      const app = createApp(FloatingBall, {
        config,
        "onUpdate:config": (newConfig: PinyinConfig) => {
          browser.runtime.sendMessage({
            type: "UPDATE_CONFIG",
            config: newConfig,
          });
          Object.assign(config, newConfig);
        },
        onProcess: (target: HTMLElement | Range) => {
          if (target instanceof Range) {
            processRange(target, config);
          } else {
            processElement(target, config);
          }
        },
      });

      app.mount(container);
    }

    // 修改创建按钮函数接收坐标参数
    function createSelectionButton(
      range: Range,
      position: { x: number; y: number },
      config: PinyinConfig
    ) {
      // 确保移除任何现有按钮
      if (currentSelectionButton) {
        currentSelectionButton.app.unmount();
        currentSelectionButton.container.remove();
        currentSelectionButton = null;
      }

      const container = document.createElement("div");
      document.body.appendChild(container);

      const app = createApp(SelectionButton, {
        x: position.x,
        y: position.y,
        onProcess: () => {
          console.log("划词 点击");
          if (range) {
            processRange(range, config);
          }
        },
        onClose: () => {
          if (currentSelectionButton) {
            currentSelectionButton.app.unmount();
            currentSelectionButton.container.remove();
            currentSelectionButton = null;
          }
        },
      });

      app.mount(container);
      currentSelectionButton = { app, container };
    }

    // 修改监听划词事件
    function listenToSelection(config: PinyinConfig) {
      let selectionEndTimeout: ReturnType<typeof setTimeout>;

      // 监听selection change事件
      document.addEventListener("selectionchange", (e) => {
        // 清除之前的定时器
        clearTimeout(selectionEndTimeout);

        // 设置新的定时器,等待选择完成
        selectionEndTimeout = setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed || !selection.rangeCount) {
            return;
          }

          const range = selection.getRangeAt(0);
          const text = range.toString().trim();

          // 只处理包含汉字的选中内容
          if (text && /[\u4e00-\u9fa5]/.test(text)) {
            // 获取选区的位置信息
            const rect = range.getBoundingClientRect();
            const scrollX =
              window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY =
              window.pageYOffset || document.documentElement.scrollTop;

            // 计算按钮位置
            let x = rect.left + scrollX;
            let y = rect.top + scrollY;

            // 确保按钮在可视区域内
            const buttonWidth = 100;
            const buttonHeight = 40;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (x + buttonWidth > viewportWidth) {
              x = viewportWidth - buttonWidth - 10;
            }

            y = y - buttonHeight - 10;
            if (y < 0) {
              y = rect.bottom + scrollY + 10;
            }

            createSelectionButton(range, { x, y }, config);
          } else if (currentSelectionButton) {
            // 如果没有选中文字,移除按钮
            currentSelectionButton.app.unmount();
            currentSelectionButton.container.remove();
            currentSelectionButton = null;
          }
        }, 200); // 200ms延迟,等待选择完成
      });

      // 处理点击事件,只在点击非SelectionButton区域时移除按钮
      document.addEventListener("click", (e) => {
        if (
          currentSelectionButton &&
          !currentSelectionButton.container.contains(e.target as Node)
        ) {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            currentSelectionButton.app.unmount();
            currentSelectionButton.container.remove();
            currentSelectionButton = null;
          }
        }
      });
    }

    // 初始化处理
    async function initPinyinConverter() {
      const config = (await browser.runtime.sendMessage({
        type: "GET_CONFIG",
      })) as PinyinConfig;

      const mergedConfig = { ...DEFAULT_CONFIG, ...config };

      // 只创建悬浮球,不自动处理页面
      createFloatingBall(mergedConfig);
      listenToSelection(mergedConfig);

      // 如果配置了自动处理,才执行处理
      if (mergedConfig.autoProcess) {
        processElement(document.body, mergedConfig);
        observeDOMChanges(mergedConfig);
      }
    }

    // 启动脚本
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPinyinConverter);
    } else {
      initPinyinConverter();
    }
  },
});
