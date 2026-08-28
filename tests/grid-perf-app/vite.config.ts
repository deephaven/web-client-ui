import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

const packagesDir = path.resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4020,
  },
  preview: {
    port: 4020,
  },
  resolve: {
    alias: {
      // Resolve local packages to their source for development
      '@deephaven/grid': path.resolve(packagesDir, 'grid/src'),
      '@deephaven/log': path.resolve(packagesDir, 'log/src'),
      '@deephaven/utils': path.resolve(packagesDir, 'utils/src'),
    },
  },
});
