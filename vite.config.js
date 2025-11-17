import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/RacerAIvsHuman/',
  build: {
    input: {
       main: resolve(__dirname, 'index.html'),
       infinte: resolve(__dirname, 'infinite.html'),
   },
  },
})
