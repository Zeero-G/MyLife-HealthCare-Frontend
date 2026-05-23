import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy API requests to NGINX gateway (backend microservices)
      proxy: {
        '/auth': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
        '/records': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
        '/emergency': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
        '/family': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
        '/ai': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
        '/notify': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
      },
    },
  };
});
