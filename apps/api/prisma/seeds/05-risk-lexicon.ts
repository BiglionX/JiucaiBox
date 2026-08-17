/**
 * 模块 05 · 风险词库
 *
 * 词库写入是 upsert（RiskWord 模型 @@unique([word, category])），
 * 所以该模块天然幂等，即便 seed.ts 被反复调用也不会重复行。
 *
 * 内容：
 *  - 复用 @jiucaibox/shared 的 RISK_LEXICON（与原 seed.ts 完全一致）
 *  - 额外追加 EXTENDED_RISK_WORDS：覆盖近两年高发的"AI 副业""国学 大师""杀猪盘"等
 */
import { RISK_LEXICON } from '@jiucaibox/shared';
import type { PrismaClient } from '@prisma/client';
import type { SeedModule } from './_shared';

/** 扩展词条（每条归类 + 权重，沿用原分类 weight） */
const EXTENDED_RISK_WORDS: { category: string; words: string[]; weight: number }[] = [
  {
    category: 'income',
    weight: 2,
    words: [
      // AI 副业话术
      'AI 副业', 'AI 写作变现', '数字人躺赚', 'AI 无人直播', 'AI 副业训练营',
      // 短期变现
      '一周回本', '日入过千', '月入十万', '三天变现', '保本保息', '固定收益',
      // 夸大收益
      '100% 收益', '保本收益', '稳赚不赔', '无风险收益',
    ],
  },
  {
    category: 'urgency',
    weight: 1.5,
    words: [
      '今天最后一次', '立刻报名', '立即锁定', '明天涨价', '今晚截止',
      '今晚 24 点', '最后 24 小时', '错过等明年', '最后名额', '今晚必须',
    ],
  },
  {
    category: 'fakeCase',
    weight: 1.5,
    words: [
      // 学员晒单新话术
      '内部学员收益图', '学员真实反馈', '学员收益截图', '学员提现到账',
      '跟着老师赚了多少', '今日学员收益', '今日实盘晒单', '今日战报',
    ],
  },
  {
    category: 'opaque',
    weight: 1.5,
    words: [
      // 新型封闭/单线联系
      '加我私聊', '老师一对一', '一对一辅导', '内部一对一', '线下面授',
      '报名后拉群', '内部群', '私密分享', '线下见面会',
      // 强调"内部分享"
      '不外传', '不能截图', '保密分享', '仅限本群',
    ],
  },
  {
    category: 'compliance',
    weight: 2,
    words: [
      // 精神传销/国学常见
      '大师亲传', '开悟', '调理身心', '化解业障', '功法传承', '明师',
      // 金融合规违规话术
      '保本理财', '稳赚计划', '内部通道', '机构通道', '通道股',
      // 直播间合规违规
      '百分百上岸', '稳上岸', '包上岸', '0 风险',
    ],
  },
];

export const seedRiskLexicon: SeedModule = async (prisma) => {
  let total = 0;

  // 原始词库（与 seed.ts 完全等价）
  for (const cat of RISK_LEXICON) {
    for (const word of cat.words) {
      await prisma.riskWord.upsert({
        where: { word_category: { word, category: cat.key } },
        update: { weight: cat.weight, active: true },
        create: { word, category: cat.key, weight: cat.weight },
      });
      total++;
    }
  }

  // 扩展词库（幂等：existing 时只刷新 weight/active，不重复）
  for (const cat of EXTENDED_RISK_WORDS) {
    for (const word of cat.words) {
      await prisma.riskWord.upsert({
        where: { word_category: { word, category: cat.category } },
        update: { weight: cat.weight, active: true },
        create: { word, category: cat.category, weight: cat.weight },
      });
      total++;
    }
  }

  console.log(`     共写入 ${total} 条风险词`);
};
