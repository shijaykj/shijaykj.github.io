import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
});
