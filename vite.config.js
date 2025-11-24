import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/vectastream/', // GitHub Pages repository name
  server: {
    host: true
  }
})
