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
    port = 4020;
  }

  return {
    base: './', // Vite defaults to absolute URLs, but embed-chart is an embedded deployment so all assets are relative paths
    envPrefix: ['VITE_', 'npm_'], // Needed to use $npm_package_version
    server: {
      port,
    },
    preview: {
      port,
    },
    resolve: {
      alias: [
        {
          find: /^@deephaven\/(.*)\/scss\/(.*)/,
          replacement: `${packagesDir}/$1/scss/$2`,
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
    },
    build: {
      outDir: env.VITE_BUILD_PATH,
      emptyOutDir: true,
      sourcemap: true,
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: id => {
            /**
             * Without this, our chunk order may cause a circular reference
             * by putting the helpers in the vendor or plotly chunk
             * This causes failures with loading the compiled version
             *
             * See https://github.com/rollup/plugins/issues/591
             */
            if (id === '\0commonjsHelpers.js') {
              return 'helpers';
            }

            if (id.includes('node_modules')) {
              if (id.includes('plotly.js')) {
                return 'plotly';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Some packages need this to start properly if they reference global
        define: {
          global: 'globalThis',
        },
      },
    },
    plugins: [htmlPlugin(), react()],
  };
});
