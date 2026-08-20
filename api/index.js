// Vercel 约定路径的 serverless function 入口（手写 JS，作为源代码提交进 git）。
// 不依赖编译产物：Vercel 拉取 git 时会包含此文件，
// 由 @vercel/node 内部 esbuild 编译并自动收集所有 .ts 源 + node_modules 依赖。
//
// 设计：
//   - 直接 require 仓库内的 apps/api/src/*.ts（这些都在 git 里）
//   - @vercel/node builder 会通过 esbuild 处理 .ts 源，
//     并在函数打包阶段按 import 关系收集所有依赖到 .vercel/output/functions/
//   - WEB_ORIGIN / DATABASE_URL 等环境变量在 Vercel dashboard 注入

require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const serverless = require('serverless-http');
const { AppModule } = require('../apps/api/src/app.module');

let cachedHandler = null;

async function bootstrap() {
  if (cachedHandler) return;
  const app = await NestFactory.create(AppModule);
  const origins = (process.env.WEB_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  cachedHandler = serverless(app.getHttpAdapter().getInstance());
}

module.exports = async function handler(req, res) {
  await bootstrap();
  return cachedHandler(req, res);
};