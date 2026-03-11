import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()], // изменено
  server: {
    port: 3001,
    open: true
  }
})