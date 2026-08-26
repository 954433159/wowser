import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import stylus from 'stylus';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const srcRoot = fileURLToPath(new URL('./src/', import.meta.url));
const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const distRoot = fileURLToPath(new URL('./dist/', import.meta.url));

export default defineConfig({
  root: srcRoot,
  publicDir: publicRoot,
  resolve: {
    alias: {
      events: require.resolve('events/'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
      string_decoder: require.resolve('string_decoder/'),
    },
  },
  css: {
    preprocessorOptions: {
      styl: {
        define: {
          url: stylus.resolver({}),
        },
      },
    },
  },
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'React.createElement',
    },
  },
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
