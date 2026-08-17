/**
 * 韭菜学院 / JiucaiBox 种子数据协调器
 * 执行: npm run db:seed  (workspace apps/api)
 *
 * 设计：
 *  - 每个模块独立位于 prisma/seeds/ 下，单独函数 + 自带幂等探测
 *  - 本文件只负责按顺序调用每个模块，并在任一模块失败时立即报错
 *  - 任意次重复执行都不会产生重复记录或运行错误
 *
 * 模块清单：
 *   01-account        管理后台账号 + 演示用户
 *   02-courses        课程 / 视频 / 真相弹窗 / 校准测试题
 *   03-radio          韭菜电台预警（包含高发新型骗局）
 *   04-stories        韭菜的泪花 UGC 案例
 *   05-risk-lexicon   风险词库（含扩展词）
 */
import { PrismaClient } from '@prisma/client';

import { seedAccounts } from './seeds/01-account';
import { seedCourses } from './seeds/02-courses';
import { seedRadio } from './seeds/03-radio';
import { seedStories } from './seeds/04-stories';
import { seedRiskLexicon } from './seeds/05-risk-lexicon';
import { runModule } from './seeds/_shared';

const prisma = new PrismaClient();

async function main() {
  console.log('开始写入种子数据...');
  console.log('---');

  // 仅展示模块级概要日志，详细日志在各模块内部
  const modules: Array<[string, (p: PrismaClient) => Promise<void>]> = [
    ['01-account      (管理员 + 演示用户)', seedAccounts],
    ['02-courses      (课程 / 视频 / 弹窗 / 测试题)', seedCourses],
    ['03-radio        (韭菜电台预警)', seedRadio],
    ['04-stories      (韭菜的泪花)', seedStories],
    ['05-risk-lexicon (风险词库)', seedRiskLexicon],
  ];

  for (const [name, fn] of modules) {
    await runModule(name, fn, prisma);
  }

  console.log('---');
  console.log('种子数据写入完成 ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
