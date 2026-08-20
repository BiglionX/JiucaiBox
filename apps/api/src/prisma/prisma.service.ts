import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
// 使用自定义生成目录的 Prisma Client（schema 变更后需重新 prisma generate）
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * serverless 环境冷启动时间预算 ≈ 5–8s：
   *   - NestJS DI 实例化（< 500ms）
   *   - Prisma 引擎 binary fork（1–2s）
   *   - Vercel 函数 maxDuration（Hobby 10s / Active CPU 60s）
   *
   * 跨太平洋连接 TiDB Cloud（ap-southeast-1 → Vercel us-east-1）需要 3–5s，
   * 同步等待 $connect 会吞噬冷启动时间预算。
   *
   * 采用 Prisma 默认 lazy connect：第一次 query 时自动 connect，不阻塞 bootstrap。
   * 保留 OnModuleDestroy 确保函数实例清理时主动断开（释放连接池）。
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
