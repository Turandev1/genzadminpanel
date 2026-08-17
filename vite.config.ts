import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mui/icons-material')) return 'mui-icons'
          if (id.includes('@mui/material') || id.includes('@emotion/')) return 'mui-core'
          if (id.includes('react-admin') || id.includes('/ra-core/') || id.includes('/ra-ui-materialui/')) return 'react-admin'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router')) return 'react-runtime'
          return undefined
        },
      },
    },
  },
})
