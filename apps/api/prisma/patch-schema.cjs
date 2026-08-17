/**
 * 一次性 schema patcher：给现有 SQLite db 的 Course 表补上新字段
 * （因运行环境不允许 prisma db push，这里走 $executeRawUnsafe）
 * 幂等：列已存在时 SQLite 抛 "duplicate column"，被吞掉
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ALTER_STEPS = [
  // 普通列：可携带非常量默认值
  `ALTER TABLE Course ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'entry'`,
  `ALTER TABLE Course ADD COLUMN targetAudience TEXT NOT NULL DEFAULT 'all'`,
  `ALTER TABLE Course ADD COLUMN estimatedMinutes INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Course ADD COLUMN summary TEXT`,
  `ALTER TABLE Course ADD COLUMN outcomes TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE Course ADD COLUMN warningTips TEXT NOT NULL DEFAULT '[]'`,
  // updatedAt：SQLite 不能用 CURRENT_TIMESTAMP 作 ADD COLUMN 的默认值，
  // 先加可空列再 UPDATE 填回 createdAt
  `ALTER TABLE Course ADD COLUMN updatedAt DATETIME`,
];

const POST_STEPS = [
  `UPDATE Course SET updatedAt = COALESCE(updatedAt, createdAt, CURRENT_TIMESTAMP)`,
];

(async () => {
  for (const sql of ALTER_STEPS) {
    try {
      await p.$executeRawUnsafe(sql);
      console.log(`  + ${sql}`);
    } catch (e) {
      const msg = String(e.message || '');
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        const m = sql.match(/ADD COLUMN (\w+)/);
        console.log(`  · 已存在: ${m ? m[1] : sql}`);
      } else {
        throw e;
      }
    }
  }
  for (const sql of POST_STEPS) {
    await p.$executeRawUnsafe(sql);
    console.log(`  ↻ backfill: ${sql}`);
  }
  await p.$disconnect();
  console.log('✔ schema 已对齐');
})().catch((e) => { console.error(e); process.exit(1); });

