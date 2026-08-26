import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import stylus from 'stylus';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const srcRoot = fileURLToPath(new URL('./src/', import.meta.url));
const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const distRoot = fileURLToPath(new URL('./dist/', import.meta.url));

const eventsPolyfill = require.resolve('events/');
const bufferPolyfill = require.resolve('buffer/');
const streamPolyfill = require.resolve('stream-browserify');
const utilPolyfill = require.resolve('util/');
const stringDecoderPolyfill = require.resolve('string_decoder/');

export default defineConfig({
  root: srcRoot,
  publicDir: publicRoot,
  resolve: {
    alias: [
      { find: /^events\/?$/, replacement: eventsPolyfill },
      { find: /^buffer\/?$/, replacement: bufferPolyfill },
      { find: /^stream\/?$/, replacement: streamPolyfill },
      { find: /^util\/?$/, replacement: utilPolyfill },
      { find: /^string_decoder\/?$/, replacement: stringDecoderPolyfill },
    ],
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
