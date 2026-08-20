import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 后端地址（本机 3000 被占用时可设置 VITE_API_TARGET 覆盖）
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3000';

// 是否合并构建到 web dist 子目录（Vercel 单 Project 模式）：
//   - Vercel 环境（VERCEL=1）下自动合并：base 切到 /admin/，outDir 写到 ../web/dist/admin
//     这样 vercel.json 的顶层 buildCommand 不需要任何额外环境变量；
//     Vite 编译出的资源路径自动带 /admin/ 前缀，与 rewrites /admin/(.*) 对齐
//   - 本地 dev / 单独 build 不受影响：base=/、outDir=dist、emptyOutDir=true
const merged = !!process.env.VERCEL;

export default defineConfig({
  // 部署到单 Project 时，admin 跑在 /admin/ 子路径下
  base: merged ? '/admin/' : '/',
  build: {
    outDir: merged ? '../web/dist/admin' : 'dist',
    emptyOutDir: !merged,
  },
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