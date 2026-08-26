import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const srcRoot = fileURLToPath(new URL('./src/', import.meta.url));
const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const distRoot = fileURLToPath(new URL('./dist/', import.meta.url));

export default defineConfig({
  root: srcRoot,
  publicDir: publicRoot,
  build: {
    outDir: distRoot,
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/pipeline': {
        target: 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
});
