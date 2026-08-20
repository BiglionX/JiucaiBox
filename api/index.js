// Vercel 约定路径的 serverless function 入口（手写 JS，作为源代码提交进 git）。
//
// 设计：薄壳 + 委托
//   - 真正的 serverless bootstrap 在 apps/api/src/vercel.ts（含 cachedHandler 单例 + CORS + ValidationPipe）
//   - api/index.js 只负责把 Vercel 路由转给 vercel.ts，@vercel/node esbuild 会一起编译进 bundle
//   - vercel.ts 用 ESM export default，CJS require 需要解包 .default
//
// @vercel/node esbuild loader 支持 .ts 自动解析，
// 因此 require('../apps/api/src/vercel') 会解析到 .ts 源文件。
module.exports = require('../apps/api/src/vercel').default;