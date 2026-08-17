/**
 * 模块 04 · 韭菜的泪花（UGC 社区案例）
 *
 * 幂等策略：按 (userNickname, title) findFirst 探测；故事用 create 创建，
 *   但任意 (userNickname, title) 组合已去重，重复跑不会产生新记录。
 *
 * 数据规模：在原 3 条基础上再增加 6 条，覆盖 live / finance / franchise / other
 * 四类全部组合，便于冷启动后社区与反割测评页面都有内容呈现。
 */
import type { PrismaClient } from '@prisma/client';
import type { SeedModule } from './_shared';

interface StorySeed {
  authorPhone: string;     // 已有演示用户手机号
  userNickname: string;    // 故事上的匿名昵称
  category: 'live' | 'finance' | 'franchise' | 'other';
  lossAmount: number;
  lossTypes: string[];
  title: string;
  content: string;
  lesson: string;
  status: 'pending' | 'approved';
  /** 多少小时之前，用于 createdAt。0 = 现在 */
  hoursAgo: number;
}

const STORY_SEEDS: StorySeed[] = [
  // ---------- 已有 3 条 ----------
  {
    authorPhone: '13800138000',
    userNickname: '韭菜B072',
    category: 'finance',
    lossAmount: 20000,
    lossTypes: ['money', 'mental'],
    title: '被某财商课割了2万：我花光积蓄买了一个"财务自由"梦',
    content:
      '去年失业后刷到一门财商课，宣称"学会复利思维，3年实现财务自由"。我花2万报了名，课程内容却全是网上免费的理财常识。老师不停推销更高价位的"私教班"，我拒绝后就被冷落。现在回想，最贵的不是学费，是我浪费的一年时间。',
    lesson: '任何课程都不会承诺收益，先学免费的真相课，再决定要不要付费。',
    status: 'approved',
    hoursAgo: 72,
  },
  {
    authorPhone: '13800138000',
    userNickname: '韭菜C315',
    category: 'live',
    lossAmount: 9800,
    lossTypes: ['money', 'time', 'family'],
    title: '9800元的"7天起号"课，我至今没起出一个号',
    content:
      '培训机构承诺"7天起号、月入过万"，我交完钱才发现教学内容全是抖音官方免费教程的拼凑。说好的"老师一对一"加了微信后就不回消息，退款无门。为了凑学费我还借了花呗，家里人知道后吵了很久。',
    lesson: '起号没有捷径，警惕任何"短时间高回报"的承诺，先看真实收入分布数据。',
    status: 'approved',
    hoursAgo: 24,
  },
  {
    authorPhone: '13800138000',
    userNickname: '韭菜D888',
    category: 'franchise',
    lossAmount: 150000,
    lossTypes: ['money', 'family'],
    title: '加盟奶茶店半年，我赔光15万积蓄',
    content:
      '总部承诺"区域独家、快速回本"，签约后发现所谓供应链价格比市场贵30%，加盟商之间恶性竞争，总部还频繁要求进货。合同里"最终解释权归甲方"，维权无门。',
    lesson: '加盟前务必查工商、查涉诉、实地考察老加盟商，合同请律师审。',
    status: 'pending',
    hoursAgo: 1,
  },
  // ---------- 新增案例 ----------
  {
    authorPhone: '13900139000',
    userNickname: '韭菜E118',
    category: 'other',
    lossAmount: 85000,
    lossTypes: ['money', 'family', 'mental'],
    title: '"国学大师"收了我父母 8.5 万，他们现在还觉得对方是大善人',
    content:
      '我爸妈去年迷上了一家"书院"，老师自称能"调理身心、化解业障"。每月"供养"少则几千多则上万，最近一次"消业"竟要 4 万。我报警才知道这类机构多以"传统文化"为壳，本质是精神传销，最可怕的是父母完全不信自己被骗。',
    lesson: '精神传销最难的不是追回钱，是把人拉回来。保留证据、联合家里其他人、报警前请先报警方心理干预专家。',
    status: 'approved',
    hoursAgo: 96,
  },
  {
    authorPhone: '13700137000',
    userNickname: '韭菜F233',
    category: 'franchise',
    lossAmount: 230000,
    lossTypes: ['money', 'time'],
    title: '加盟"网红炸鸡"前后，我交了 23 万学费',
    content:
      '"签约即回本、明星代言、月销 30 万"是我听过的最动听的话。结果选址老师带我去的是商场冷区，原料比同行贵 25%，总部强制定制设备、装修物料，连外卖包装都必须从总部进货。半年亏光所有。',
    lesson: '明星代言不等于品牌可靠，加盟前必查：1）近 3 年加盟商存活率；2）原料/设备强制采购清单；3）总部自身诉讼记录。',
    status: 'approved',
    hoursAgo: 120,
  },
  {
    authorPhone: '13900139000',
    userNickname: '韭菜G051',
    category: 'finance',
    lossAmount: 38000,
    lossTypes: ['money'],
    title: '"内部消息稳赚" 把我和舅舅都套进去了',
    content:
      '同学把我拉进一个"内部消息群"，说跟着老师买某只港股"稳赚 30%"。我先投了 5000 试水，真的赚回来了，于是又拉我舅舅投了 4 万。结果第 3 次"重仓"行情反转，全部亏损。所谓"老师"后来群里把我们踢了。',
    lesson: '任何带"内部消息、稳赚不赔"的群都是骗局，先查"持证机构 + 证监会公示"，再谈投资。',
    status: 'approved',
    hoursAgo: 144,
  },
  {
    authorPhone: '13800138000',
    userNickname: '韭菜H427',
    category: 'live',
    lossAmount: 3600,
    lossTypes: ['money', 'time'],
    title: '"9.9 体验课后我被诱导买了 3600 的年课"',
    content:
      '直播间里主播很真诚，9.9 体验课质量确实还行。第 3 天班主任加我微信，发来大量"学员晒单"，并说"现在报年课送 1 对 1 陪跑，月入过万"。我刷了花呗买的。现在回看，晒单全是托，陪跑老师只发我 3 条语音就没下文了。',
    lesson: '低价引流 + 群内晒单 + 名额倒计时，三件套几乎 100% 是套路。任何升级付费前必须冷静 24 小时。',
    status: 'pending',
    hoursAgo: 6,
  },
  {
    authorPhone: '13700137000',
    userNickname: '韭菜I019',
    category: 'other',
    lossAmount: 12000,
    lossTypes: ['money', 'time'],
    title: '"AI 副业训练营" 把我从迷茫割到清醒',
    content:
      '失业 3 个月，看到"AI 写作日入 500"的训练营，6800 元报名。结果课程讲的是 ChatGPT 官方文档全部免费内容，老师提供的"独家 prompt"网上一搜就有。学完唯一的收获是学会了用免费工具自己写脚本。',
    lesson: 'AI 工具大多免费，付费课程的价值要看它有没有提供你搜不到的内容。',
    status: 'approved',
    hoursAgo: 48,
  },
  {
    authorPhone: '13900139000',
    userNickname: '韭菜J663',
    category: 'finance',
    lossAmount: 56000,
    lossTypes: ['money', 'family'],
    title: '"恋爱 + 投资"组合拳，我被前前后后骗走 5.6 万',
    content:
      '交友平台认识的"男友"，每天嘘寒问暖，聊到第 3 周他说"带你做副业"。先跟着他在某 App 投了 3000，收益真到账；接着投了 1 万、3 万、5 万——等到要"提现 20 万"时，被告知要再交 4.7 万保证金。我这才醒悟，但对方已经消失。',
    lesson: '网络恋人短期内引导你下载 App、做投资、转账的，100% 是杀猪盘。立即停止转账，保留全部记录报警 96110。',
    status: 'pending',
    hoursAgo: 12,
  },
];

export const seedStories: SeedModule = async (prisma) => {
  for (const s of STORY_SEEDS) {
    const dup = await prisma.story.findFirst({
      where: { userNickname: s.userNickname, title: s.title },
    });
    if (dup) {
      console.log(`     (skip) 已存在故事: ${s.title}`);
      continue;
    }

    // 解析作者 userId：如不存在则用最早那个 demo user（兜底）
    let author = await prisma.user.findUnique({ where: { phone: s.authorPhone } });
    if (!author) {
      author = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
    }
    if (!author) {
      console.log(`     (skip) 无可用作者用户，跳过: ${s.title}`);
      continue;
    }

    await prisma.story.create({
      data: {
        userId: author.id,
        userNickname: s.userNickname,
        category: s.category,
        lossAmount: s.lossAmount,
        lossTypes: s.lossTypes,
        title: s.title,
        content: s.content,
        lesson: s.lesson,
        status: s.status,
        createdAt: new Date(Date.now() - s.hoursAgo * 3600 * 1000),
      },
    });
    console.log(`     + ${s.status === 'approved' ? '已发布' : '待审  '} ${s.title}`);
  }
};
