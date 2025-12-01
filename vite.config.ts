import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://heberge-rapide.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  define: {
    // Polyfill partiel de process.env pour éviter les crashs si une lib l'utilise
    'process.env': {
      API_KEY: process.env.API_KEY || ''
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});