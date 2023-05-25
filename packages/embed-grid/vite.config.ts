/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const packagesDir = path.resolve(__dirname, '..');

  let port = Number.parseInt(env.PORT, 10);
  if (Number.isNaN(port) || port <= 0) {
    port = 4010;
  }

  const baseURL = new URL(env.BASE_URL, `http://localhost:${port}/`);
  // These are paths which should be proxied to the core server
  // https://vitejs.dev/config/server-options.html#server-proxy
  const proxy = {
    // proxy the websocket requests, allows tunneling to work with a single port
    '^/arrow\\.*': {
      target: env.VITE_PROXY_URL,
      changeOrigin: true,
      ws: true,
    },
    '^/io\\.deephaven\\..*': {
      target: env.VITE_PROXY_URL,
      changeOrigin: true,
      ws: true,
    },
  };

  // Some paths need to proxy to the engine server
  // Vite does not have a "any unknown fallback to proxy" like CRA
  // It is possible to add one with a custom middleware though if this list grows
  if (env.VITE_PROXY_URL) {
    [env.VITE_CORE_API_URL, env.VITE_MODULE_PLUGINS_URL].forEach(p => {
      const route = new URL(p, baseURL).pathname;
      proxy[route] = {
        target: env.VITE_PROXY_URL,
        changeOrigin: true,
      };
    });
  }

  return {
    base: './', // Vite defaults to absolute URLs, but embed-grid is an embedded deployment so all assets are relative paths
    envPrefix: ['VITE_', 'npm_'], // Needed to use $npm_package_version
    server: {
      port,
      proxy,
    },
    preview: {
      port,
      proxy,
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
    optimizeDeps: {
      esbuildOptions: {
        // Some packages need this to start properly if they reference global
        define: {
          global: 'globalThis',
        },
      },
    },
    plugins: [react()],
  };
});
