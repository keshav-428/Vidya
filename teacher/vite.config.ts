import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The teacher app is its OWN Vite app and its own deploy. It shares nothing
// with the student app but the backend, which is the point: the student app
// cannot break because of a change made here.
export default defineConfig({
  server: {
    port: 5174,   // student app keeps Vite's default 5173
    proxy: {
      // Same dev wiring as the student app: /api → the local FastAPI backend.
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react()],
})
