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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
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
        '/appointments': {
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
