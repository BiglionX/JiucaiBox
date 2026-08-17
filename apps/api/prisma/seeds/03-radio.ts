/**
 * 模块 03 · 韭菜电台（预警快讯）
 *
 * 幂等策略：电台表没有"标题唯一"约束，按 (title, summary) findFirst 探测后写入。
 */
import type { PrismaClient } from '@prisma/client';
import type { SeedModule } from './_shared';

interface RadioSeed {
  title: string;
  sourceUrl: string;
  sourceLabel: string;
  summary: string;
  tricks: { name: string; description: string }[];
  warning: string;
}

const RADIO_SEEDS: RadioSeed[] = [
  {
    title: '创刊号：传销头目出狱后变"国学大师"，如是书院已关停',
    sourceUrl: 'https://www.baidu.com/',
    sourceLabel: '权威媒体',
    summary:
      '浙江新昌"如是书院"违法经营已被关停，赖某明等3人虐待学员被刑拘。传销头目出狱后借"传统文化""修行"包装传销本质，重新收割。',
    tricks: [
      { name: '身份洗白', description: '利用"传统文化""修行"包装传销本质，回避真实履历。' },
      { name: '精神控制', description: '封闭环境切断外界联系，逐步洗脑，要求保密、远离家人。' },
      { name: '高额收费 + 暴力威胁', description: '交钱只是开始，不服从就虐待，甚至逼学员贷款。' },
    ],
    warning:
      '家人若突然迷上某"大师"并频繁要钱，请先查询其是否有前科，并警惕精神传销。可拨打 12315 或向公安机关举报。',
  },
  {
    title: '第2期："AI无人直播躺赚"的真相',
    sourceUrl: 'https://www.baidu.com/',
    sourceLabel: '官方通报',
    summary:
      '多地市场监管部门通报"无人直播躺赚"培训骗局：以低价课引流，再推销数千元"代理"服务，最终无法兑现承诺。',
    tricks: [
      { name: '低价引流', description: '9.9元体验课吸引报名，再话术升级推销高价服务。' },
      { name: '夸大承诺', description: '"全自动赚钱、无需运营"，回避平台规则与封号风险。' },
      { name: '催促付款', description: '"最后3天""名额有限"制造紧迫感，压缩决策时间。' },
    ],
    warning: '任何宣称"全自动躺赚"的项目都需警惕，建议先用反割测评工具免费检测再决定。',
  },
  // ---------- 新增预警 ----------
  {
    title: '第3期：杀猪盘升级版——"恋爱 + 跨境投资"组合拳',
    sourceUrl: 'https://www.baidu.com/',
    sourceLabel: '权威媒体',
    summary:
      '近期多地警方通报跨境杀猪盘新变种：骗子在相亲/社交平台以"恋爱"取得信任，再诱导至境外平台投资虚拟币、外汇、影视版权，回款时才发现无法提现。受害者人均损失已突破 30 万元。',
    tricks: [
      { name: '人设包装', description: '伪装高富帅/白富美，配图精致、生活体面，长期感情铺垫。' },
      { name: '诱导下载小众 App', description: '将受害者引导至无法在应用商店搜到的"投资平台"，绕开监管。' },
      { name: '小额返利骗信任', description: '前几笔小额投资确能提现，制造"能赚钱"的错觉。' },
      { name: '情绪操控 + 时间压力', description: '"我们未来的家""再投一点就够首付"，逼你加大投入。' },
    ],
    warning:
      '凡是网恋对象短期内让你下载陌生 App、注册账户、转账投资的，100% 是骗局。发现可疑请立即报警 96110，并保留全部聊天与转账记录。',
  },
  {
    title: '第4期：未成年人"免费游戏皮肤"骗局高发',
    sourceUrl: 'https://www.baidu.com/',
    sourceLabel: '官方通报',
    summary:
      '暑假期间多地公安通报：骗子潜伏在学生群里，以"免费领皮肤""解除防沉迷"为饵，引导孩子偷家长手机扫码支付，单笔最高损失超过 5 万元。',
    tricks: [
      { name: '冒充客服/官方', description: '伪造"游戏客服"头像、话术，先套近乎再"指导操作"。' },
      { name: '屏幕共享诈骗', description: '要求孩子打开屏幕共享，亲眼"指导"家长支付。' },
      { name: '威胁 + 利诱双管齐下', description: '"不操作就封号""完成后返 200 元"，用恐惧+奖励双线操控。' },
    ],
    warning:
      '家长务必关闭免密支付、关闭 Face ID / 小额免密，并开启微信/支付宝支付二次验证。已发生的充值请立即保留证据并联系平台客服申诉。',
  },
  {
    title: '第5期：假冒"证监会工作人员"电话诈骗',
    sourceUrl: 'https://www.baidu.com/',
    sourceLabel: '权威媒体',
    summary:
      '近期出现"证监会工作人员"电话诈骗新变种：对方能准确说出你的姓名、身份证号、持仓信息，以"账户异常需清退资金"为由诱导你下载视频会议软件、共享屏幕、转账至所谓"安全账户"。',
    tricks: [
      { name: '精准信息泄露', description: '黑产交易流通的个人信息让骗子"看起来像官方"。' },
      { name: '屏幕共享 + 远程操控', description: '通过视频会议实时看到你的登录验证码与转账流程。' },
      { name: '"安全账户"骗局', description: '任何让你把钱转到所谓"安全账户"的，都是骗局。' },
    ],
    warning:
      '证监会及其派出机构不会通过电话要求转账、不会要求下载屏幕共享软件、不会设立"安全账户"。遇此类电话请立即挂断并拨打 12386 核实。',
  },
];

export const seedRadio: SeedModule = async (prisma) => {
  for (const r of RADIO_SEEDS) {
    const dup = await prisma.radioEpisode.findFirst({
      where: { title: r.title, summary: r.summary },
    });
    if (dup) {
      console.log(`     (skip) 已存在电台: ${r.title}`);
      continue;
    }
    await prisma.radioEpisode.create({ data: r });
    console.log(`     + 新增电台: ${r.title}`);
  }
};
