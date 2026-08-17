/**
 * 种子模块共享工具
 * - 所有模块都依赖统一的 Prisma 客户端
 * - 统一日志格式:  ✔ <模块>: ...
 */
import type { PrismaClient } from '@prisma/client';

export type SeedModule = (prisma: PrismaClient) => Promise<void>;

export async function runModule(name: string, fn: SeedModule, prisma: PrismaClient): Promise<void> {
  process.stdout.write(`  · ${name} ... `);
  try {
    await fn(prisma);
    process.stdout.write('✔\n');
  } catch (err) {
    process.stdout.write('✘\n');
    throw err;
  }
}
