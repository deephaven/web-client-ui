/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
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

  // Proxy to local dev server for js-plugins
  if (env.VITE_JS_PLUGINS_DEV_PORT && env.VITE_MODULE_PLUGINS_URL) {
    const route = new URL(env.VITE_MODULE_PLUGINS_URL, baseURL).pathname;
    proxy[route] = {
      target: `http://localhost:${env.VITE_JS_PLUGINS_DEV_PORT}`,
      changeOrigin: true,
      rewrite: (pathOrig: string) => pathOrig.replace(/^\/js-plugins/, ''),
    };
  }

  return {
    base: './', // Vite defaults to absolute URLs, but embed-widget is an embedded deployment so all assets are relative paths
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
      dedupe: ['react', 'react-redux', 'redux'],
      alias:
        mode === 'development'
          ? [
              {
                find: /^@deephaven\/(.*)\/scss\/(.*)/,
                replacement: `${packagesDir}/$1/scss/$2`,
              },
              {
                find: /^@deephaven\/(?!icons|jsapi-types)(.*)/, // Icons package can not import from src
                replacement: `${packagesDir}/$1/src`,
              },
            ]
          : [],
    },
    build: {
      outDir: env.VITE_BUILD_PATH,
      emptyOutDir: true,
      sourcemap: true,
      // modulePreload: {
      //   resolveDependencies: (
      //     filename: string,
      //     deps: string[],
      //     context: {
      //       hostId: string;
      //       hostType: 'html' | 'js';
      //     }
      //   ) => {
      //     return [];
      //     // eslint-disable-next-line no-param-reassign
      //     deps = deps.filter(dep => !dep.includes('monaco-'));
      //     console.log('[TESTING]', filename, deps, context);
      //     return deps;
      //   },
      // },
      modulePreload: false,
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

            // if (id.includes('packages')) {
            //   if (id.includes('packages/console/dist')) {
            //     return 'deephaven-console';
            //   }
            // }

            if (id.includes('node_modules')) {
              if (id.includes('monaco-editor')) {
                return 'monaco';
              }
              if (id.includes('plotly.js')) {
                return 'plotly';
              }
              if (id.includes('mathjax')) {
                return 'mathjax';
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
    plugins: [
      react(),
      {
        /**
         * Plugin to log monaco imports. Notes:
         * 1. All imports show in `chunk.imports` array (even lazy ones)
         * 2. Lazy imports show in `chunk.dynamicImports` array
         *
         * Goal would be for Monaco to always be lazy imported at least for the
         * main chunk. As-is, it shows up a number of times only in the
         * `chunk.imports`. Haven't been able to figure out why.
         */
        name: 'log-chunk-deps',
        generateBundle(options, bundle) {
          // eslint-disable-next-line no-restricted-syntax
          for (const [fileName, chunk] of Object.entries(bundle)) {
            const isMonaco = i => i.includes('monaco-');

            if (
              chunk.type === 'chunk' &&
              (chunk.imports.some(isMonaco) ||
                chunk.dynamicImports.some(isMonaco))
            ) {
              console.log(
                `Chunk: ${fileName}${chunk.isEntry ? ', isEntry' : ''}`
              );
              console.log(
                JSON.stringify(
                  {
                    imports: chunk.imports,
                    dynamicImports: chunk.dynamicImports,
                  },
                  null,
                  2
                )
              );
            }
          }
        },
      },
      // Different visualizations of the bundle
      (
        [
          // 'flamegraph',
          // 'list',
          // 'network',
          // 'raw-data',
          // 'sunburst',
          'treemap',
        ] as const
      ).map(template =>
        visualizer({
          open: true,
          filename: `stats-${template}.html`,
          template,
        })
      ),
    ],
  };
});
