import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const appEnv = loadEnv(mode, process.cwd(), 'TEXTFX_BACKEND_PROXY_URL')
  const backendTarget = process.env.TEXTFX_BACKEND_PROXY_URL?.trim() || appEnv.TEXTFX_BACKEND_PROXY_URL?.trim() || 'http://localhost:3001'

  return {
  base: './',

  plugins: [react()],

  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/healthz': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pdf':   ['jspdf'],
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
  },
  }
})
