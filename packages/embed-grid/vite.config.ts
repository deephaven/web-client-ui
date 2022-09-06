/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // https://github.com/vitejs/vite/issues/3105#issuecomment-939703781
  const htmlPlugin = () => ({
    name: 'html-transform',
    transformIndexHtml(html: string) {
      return html.replace(/#(.*?)#/g, (_, p1) => env[p1]);
    },
  });

  const packagesDir = path.resolve(__dirname, '..');

  let port = Number.parseInt(env.PORT, 10);
  if (Number.isNaN(port) || port <= 0) {
    port = 4010;
  }

  return {
    base: './', // Vite defaults to absolute URLs, but embed-grid is an embedded deployment so all assets are relative paths
    server: {
      port,
    },
    resolve: {
      alias: [
        {
          find: /^@deephaven\/components\/scss\/(.*)/,
          replacement: `${packagesDir}/components/scss/$1`,
        },
        {
          find: /^@deephaven\/golden-layout$/,
          replacement: `${packagesDir}/golden-layout/dist/goldenlayout.js`,
        },
        {
          find: /^@deephaven\/golden-layout\/(.*)$/,
          replacement: `${packagesDir}/golden-layout/$1`,
        },
        {
          find: /^@deephaven\/icons$/,
          replacement: `${packagesDir}/icons/dist/index.es.js`,
        },
        {
          find: /^@deephaven\/(.*)/,
          replacement: `${packagesDir}/$1/src`,
        },
      ],
      // TODO: See if this is better than the last find/replace above
      // In theory this can load from package.json source field instead of main
      // mainFields: ['source', 'module', 'main', 'jsnext:main', 'jsnext'],
    },
    build: {
      outDir: env.VITE_BUILD_PATH,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: id => {
            if (id.includes('node_modules')) {
              if (id.includes('monaco-editor')) {
                return 'monaco';
              }
              if (id.includes('plotly.js')) {
                return 'plotly';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    // optimizeDeps: {
    //   // plotly.js requires buffer and vite tries to externalize it
    //   // dev mode fails to start if it isn't excluded from being externalized
    //   // exclude: ['buffer'],
    //   esbuildOptions: {
    //     // Plotly imports has-hover which needs global to exist
    //     // Without this, dev mode does not start properly
    //     define: {
    //       global: 'globalThis',
    //     },
    //   },
    // },
    plugins: [htmlPlugin(), react()],
  };
});
