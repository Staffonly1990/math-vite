/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages: сайт живёт в подпапке /math-vite/
  base: '/math-vite/',
  // старые мобильные браузеры: консервативный синтаксис
  build: { target: 'es2018' },
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    port: 5174,
    watch: {
      // OneDrive рвёт file-watcher события — читаем изменения опросом
      usePolling: true,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
