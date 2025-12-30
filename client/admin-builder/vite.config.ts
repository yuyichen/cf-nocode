import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    qiankun('admin-builder', {
      useDevMode: true
    })
  ],
  server: {
    port: 3003,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:3003',
  },
  base: 'http://localhost:3003/',
})
