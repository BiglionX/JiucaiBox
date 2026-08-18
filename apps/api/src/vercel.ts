/**
 * Vercel Serverless Function 入口
 *
 * 将整个 NestJS 应用（apps/api）打包为一个 Node.js 函数，
 * 由 vercel.json 的 rewrites 把 /api/* 与 /api/admin/* 转发到此入口。
 *
 * 设计要点：
 *  - 单实例复用：函数冷启动时执行 NestFactory.create + init()，
 *    之后的热请求直接复用缓存的 handler，避免每次冷启动开销。
 *  - 与本地开发共用同一份 AppModule、main.ts 的 CORS / ValidationPipe 配置。
 *  - Vercel 默认 Node 运行时直接提供 Node req/res，
 *    可直接由 serverless-http 适配为 (req, res) 处理器。
 */
// 必须先加载 reflect-metadata 让 Reflect.metadata polyfill 生效，
// 否则 NestJS 装饰器元数据（构造器注入等）会丢失。tsc 默认会保留该
// side-effect import（编译产物顶部出现 require('reflect-metadata')）。
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import serverless from 'serverless-http';
import { AppModule } from './app.module';

let cachedApp: any = null;
let cachedHandler: any = null;

async function bootstrap(): Promise<void> {
  if (cachedHandler) return;

  const app = await NestFactory.create(AppModule);

  // CORS：与本地 main.ts 保持一致
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
  cachedApp = app;
  cachedHandler = serverless(app.getHttpAdapter().getInstance());
}

export default async function handler(req: unknown, res: unknown): Promise<unknown> {
  await bootstrap();
  return cachedHandler(req, res);
}