import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import VitePluginYAML from '@modyfi/vite-plugin-yaml'

export default defineConfig({
  plugins: [
    react(),
    VitePluginYAML(),
  ],
})

