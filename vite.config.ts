import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-core': ['vue', 'vue-router', 'pinia'],
          'primevue': ['primevue', '@primevue/themes'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'echarts': ['echarts', 'vue-echarts'],
          'xlsx': ['xlsx']
        }
      }
    }
  }
})
