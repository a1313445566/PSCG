import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import docsGenerator from './vite-plugins/docsGenerator.js'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), docsGenerator()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'echarts': ['echarts'],
          'quill': ['quill']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  // 禁用大型库的预加载
  modulePreload: {
    resolveDependencies: (url, deps) => {
      // 只预加载核心库，不预加载 element-plus 和 echarts
      return deps.filter(dep => 
        !dep.includes('element-plus') && 
        !dep.includes('echarts')
      )
    }
  }
})
