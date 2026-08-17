import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 使用自定义生成目录的 Prisma Client（schema 变更后需重新 prisma generate）
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
