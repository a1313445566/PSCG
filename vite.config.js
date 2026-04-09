import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import docsGenerator from './vite-plugins/docsGenerator.js'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), docsGenerator()],
  base: './',
  css: {
    preprocessorOptions: {
      scss: {
        // Vite 8 + Sass 2.0：使用 modern-compiler API 避免 legacy 弃用警告
        api: 'modern-compiler',
        additionalData: `@use "@/styles/scss/abstracts/_variables.scss" as *;\n`
      }
    }
  },
  resolve: {
    alias: {
      // Vite 8 严格 ESM 环境，使用 import.meta.dirname 替代 __dirname
      '@': path.resolve(import.meta.dirname, 'src')
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Vite 8：Rolldown 替代 Rollup，使用 rolldownOptions
    rolldownOptions: {
      output: {
        // Vite 8：manualChunks 函数已废弃，改用 codeSplitting.groups
        codeSplitting: {
          groups: [
            {
              name: 'vue-vendor',
              test: /[\\/]node_modules[\\/](vue|vue-router|pinia)/,
              priority: 20
            },
            { name: 'element-plus', test: /[\\/]node_modules[\\/]element-plus/, priority: 15 },
            { name: 'quill', test: /[\\/]node_modules[\\/]quill/, priority: 15 },
            { name: 'vchart-all', test: /[\\/]node_modules[\\/]@visactor[\\/]vchart/, priority: 15 }
          ]
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
        changeOrigin: true
      },
      '/images': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/audio': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  // 禁用大型库的预加载
  modulePreload: {
    resolveDependencies: (url, deps, { hostType }) => {
      // 只预加载核心库，不预加载 element-plus
      return deps.filter(dep => !dep.includes('element-plus'))
    }
  }
})
