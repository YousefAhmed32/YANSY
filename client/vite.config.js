import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 700,
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react'  : ['react', 'react-dom', 'react-router-dom'],
          // State management
          'vendor-state'  : ['@reduxjs/toolkit', 'react-redux'],
          // Animation libraries (heaviest — separate so main bundle stays lean)
          'vendor-gsap'   : ['gsap'],
          'vendor-motion' : ['framer-motion'],
          // i18n
          'vendor-i18n'   : ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Utilities
          'vendor-misc'   : ['axios', 'date-fns', 'lucide-react', 'react-hot-toast', 'react-hook-form'],
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'gsap'],
  },
});
