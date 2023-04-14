// This is a dev dependency for building, so importing dev deps is fine
/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // https://github.com/vitejs/vite/issues/3105#issuecomment-939703781
  const htmlPlugin = () => ({
    name: 'html-transform',
    transformIndexHtml: {
      enforce: 'pre' as const,
      transform(html: string) {
        return html.replace(/#(.*?)#/g, (_, p1) => env[p1]);
      },
    },
  });

  const packagesDir = path.resolve(__dirname, '..');

  let port = Number.parseInt(env.PORT, 10);
  if (Number.isNaN(port) || port <= 0) {
    port = 4000;
  }

  // These are paths which should be proxied to the core server
  // https://vitejs.dev/config/server-options.html#server-proxy
  const proxy = {
    // Proxy styleguide here instead of as a route in our app router
    // That way, it is not included in the production build
    '/styleguide': {
      target: `http://localhost:${port}/src/styleguide/index.html`,
      rewrite: () => '',
    },

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
    [
      env.VITE_CORE_API_URL,
      env.VITE_NOTEBOOKS_URL,
      env.VITE_LAYOUTS_URL,
      env.VITE_MODULE_PLUGINS_URL,
    ].forEach(p => {
      proxy[p] = {
        target: env.VITE_PROXY_URL,
        changeOrigin: true,
      };
    });
  }

  return {
    // Vite does not read this env variable, it sets it based on the config
    // For easy changes using our .env files, read it here and vite will just set it to the existing value
    base: env.BASE_URL,
    envPrefix: ['VITE_', 'npm_'], // Needed to use $npm_package_version
    server: {
      port,
      open: true,
      proxy,
    },
    preview: {
      port,
      open: true,
      proxy,
    },
    resolve: {
      dedupe: ['react', 'react-redux', 'redux'],
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
      outDir: path.resolve(__dirname, env.VITE_BUILD_PATH),
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
    css: {
      devSourcemap: true,
    },
    plugins: [htmlPlugin(), react()],
  };
});
