import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000'
const allowedHosts = [
  'webproject.id.lv',
  'www.webproject.id.lv',
  'localhost',
  '127.0.0.1',
]

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
    hmr: {
      protocol: 'wss',
      host: 'webproject.id.lv',
      clientPort: 443,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
  }
})
