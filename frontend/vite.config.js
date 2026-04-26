import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    proxy: {
      '/jokes': 'http://localhost:3000', // Changed 127.0.0.1 to localhost for better compatibility
    },
  },
  plugins: [react()],
})