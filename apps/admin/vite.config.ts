import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 后端地址（本机 3000 被占用时可设置 VITE_API_TARGET 覆盖）
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      // 管理后台与用户端 API 统一代理到后端服务
      '/admin': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // @jiucaibox/shared 尚未执行 build 时也能直接引用 TS 源码，
      // 保证 dev / build 开箱即用（仍按 monorepo 依赖声明于 package.json）
      '@jiucaibox/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
});
