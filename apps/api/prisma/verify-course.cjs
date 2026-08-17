const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const rows = await p.course.findMany({
    select: {
      id: true, title: true, category: true,
      difficulty: true, targetAudience: true,
      estimatedMinutes: true, summary: true,
      outcomes: true, warningTips: true,
      _count: { select: { videos: true, quizQuestions: true } },
    },
    orderBy: { id: 'asc' },
  });
  console.log(`总数：${rows.length} 门课`);
  for (const r of rows) {
    console.log(`\n#${r.id} ${r.title}`);
    console.log(`  category=${r.category}  difficulty=${r.difficulty}  audience=${r.targetAudience}  ~${r.estimatedMinutes}分`);
    console.log(`  视频 ${r._count.videos} 节 / 测试题 ${r._count.quizQuestions} 道`);
    console.log(`  summary: ${(r.summary || '').slice(0, 60)}…`);
    console.log(`  outcomes(${Array.isArray(r.outcomes) ? r.outcomes.length : 0}): ${(r.outcomes || []).slice(0, 2).join(' / ')}…`);
    console.log(`  warningTips(${Array.isArray(r.warningTips) ? r.warningTips.length : 0}): ${(r.warningTips || []).slice(0, 2).join(' / ')}…`);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
