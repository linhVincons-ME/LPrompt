import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  publicDir: 'extension/public',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'extension-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(import.meta.dirname, 'extension/sidepanel.html'),
        contentScript: resolve(import.meta.dirname, 'extension/contentScript.ts'),
        serviceWorker: resolve(import.meta.dirname, 'extension/serviceWorker.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
