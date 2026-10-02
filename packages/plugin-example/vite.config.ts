/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// The host application provides these singletons at runtime via the import map
// injected by @deephaven/app-utils. They must NOT be bundled into the plugin so
// that the plugin shares the host's instances (one React, one redux store, one
// design system, ...).
const external = [
  'react',
  'react-dom',
  'redux',
  'react-redux',
  '@deephaven/components',
  '@deephaven/dashboard',
  '@deephaven/icons',
  '@deephaven/jsapi-bootstrap',
  '@deephaven/jsapi-types',
  '@deephaven/log',
  '@deephaven/plugin',
];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inject each chunk's CSS via JS so styles for lazy-loaded chunks are added
    // to the document when the chunk is dynamically imported, rather than
    // requiring a separate <link> the host would have to know about.
    // `relativeCSSInjection` keeps each chunk's CSS with that chunk so the lazy
    // chunk's styles only load when the chunk is imported.
    cssInjectedByJsPlugin({ relativeCSSInjection: true }),
  ],
  build: {
    // Emit a code-split ES module so dynamic import() in the plugin produces
    // separate chunks that load on demand.
    cssCodeSplit: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external,
    },
  },
});
