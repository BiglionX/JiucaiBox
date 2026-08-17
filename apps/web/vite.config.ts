import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 后端地址（本机 3000 被占用时可设置 VITE_API_TARGET 覆盖）
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 共享包尚未 build 时直接指向源码，保证 dev / typecheck 可用
      '@jiucaibox/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/admin': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
