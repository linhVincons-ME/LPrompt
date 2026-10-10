import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Content script được trình duyệt nạp dạng classic script (không hỗ trợ `import`),
// nên phải build riêng thành một file IIFE tự chứa. Dùng chung cho Chrome và Firefox:
// truyền `--outDir extension-dist-firefox` khi build bản Firefox.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'extension-dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'extension/contentScript.ts'),
      formats: ['iife'],
      name: 'LPromptContentScript',
      fileName: () => 'contentScript.js'
    }
  }
});
