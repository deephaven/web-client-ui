/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dns from 'dns';

// Open on localhost instead of 127.0.0.1 for Node < 17
// https://github.com/vitejs/vite/issues/9195
dns.setDefaultResultOrder('verbatim');

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

  // These are paths which should be proxied to the core server
  // https://vitejs.dev/config/server-options.html#server-proxy
  const proxy = {};
  const proxyPaths = [
    env.VITE_CORE_API_URL,
    env.VITE_NOTEBOOKS_URL,
    env.VITE_LAYOUTS_URL,
  ];

  if (env.VITE_PROXY_URL) {
    proxyPaths.forEach(p => {
      proxy[p] = {
        target: env.VITE_PROXY_URL,
        changeOrigin: true,
      };
    });
  }

  return {
    base: env.BASE_URL,
    server: {
      port: Number.parseInt(env.PORT, 10) ?? 4000,
      open: true,
      proxy,
    },
    resolve: {
      dedupe: ['react', 'react-redux', 'redux'],
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
      // It seems there is currently a bug though
      // https://github.com/vitejs/vite/issues/8659
      // mainFields: ['source', 'module', 'main', 'jsnext:main', 'jsnext'],
    },
    build: {
      outDir: path.resolve(__dirname, env.VITE_BUILD_PATH),
      emptyOutDir: true,
      commonjsOptions: {
        include: [/node_modules/, /golden-layout/],
      },
      rollupOptions: {
        output: {
          manualChunks: id => {
            if (id.includes('node_modules') && !id.includes('jquery')) {
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
    // This and the build.commonjsOptions are needed b/c golden-layout is not ESM
    // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
    optimizeDeps: {
      include: ['@deephaven/golden-layout'],
    },
    plugins: [
      htmlPlugin(),
      react({
        jsxRuntime: 'classic',
      }),
    ],
  };
});
