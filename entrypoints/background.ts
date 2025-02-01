import { DEFAULT_CONFIG } from "./shared/types";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
  // 监听配置变化
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "UPDATE_CONFIG") {
      chrome.storage.sync.set(request.config);
    }
  });

  // 默认初始化配置
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set(DEFAULT_CONFIG);
  });

  // 存储生词
  interface WordItem {
    word: string;
    pinyin: string;
    timestamp: number;
  }

  // 添加生词
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ADD_WORD") {
      chrome.storage.sync.get({ wordList: [] }, (result) => {
        const wordList: WordItem[] = result.wordList;
        wordList.push({
          word: request.word,
          pinyin: request.pinyin,
          timestamp: Date.now(),
        });
        chrome.storage.sync.set({ wordList });
      });
    }
  });

  // 处理配置获取请求
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_CONFIG") {
      chrome.storage.sync.get(DEFAULT_CONFIG, (config) => {
        sendResponse(config);
      });
      return true; // 保持消息通道开启
    }
  });

  // 导出生词本
  function exportWords(format: "anki" | "excel") {
    chrome.storage.sync.get({ wordList: [] }, (result) => {
      const wordList: WordItem[] = result.wordList;

      if (format === "anki") {
        const ankiText = wordList
          .map((item) => `${item.word}\t${item.pinyin}`)
          .join("\n");

        const blob = new Blob([ankiText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: "vocabulary.txt",
        });
      } else {
        // Excel格式导出
        const csvContent =
          "汉字,拼音,添加时间\n" +
          wordList
            .map(
              (item) =>
                `${item.word},${item.pinyin},${new Date(
                  item.timestamp
                ).toLocaleString()}`
            )
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: "vocabulary.csv",
        });
      }
    });
  }

  // 处理导出请求
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXPORT_WORDS") {
      exportWords(request.format);
    }
  });
});
