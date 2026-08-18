import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS：按 .env WEB_ORIGIN 逗号分隔白名单，或 * 放行
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

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  Logger.log(`🐛 韭菜学院 API 已启动: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`   健康检查: http://localhost:${port}/api/health`, 'Bootstrap');
}

bootstrap();
