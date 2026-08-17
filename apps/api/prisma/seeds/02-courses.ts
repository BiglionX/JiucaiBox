/**
 * 模块 02 · 课程 / 视频 / 真相弹窗 / 校准测试题
 *
 * 设计：
 *  - 课程画像统一在 COURSE_META 中定义（difficulty / targetAudience / summary / outcomes / warningTips）
 *  - 已有课程：findFirst 后做 update，把新字段补齐（幂等、可重复跑）
 *  - 新增课程：直接 create（同样幂等：按 title 探测）
 *  - estimatedMinutes 由 videos.duration 求和自动计算
 *
 * 课程清单（11 门）：
 *   1. 直播行业真相课                    truth        entry
 *   2. 韭菜体验营（直播版）              experience   entry
 *   3. 韭菜财商学院                      finance      intermediate
 *   4. 韭菜致富营                        franchise    intermediate
 *   5. AI 韭菜课 · 2024                  truth        intermediate
 *   6. 未成年人充值退款必修课            truth        entry
 *   ── 以下为本次新增 5 门 ──
 *   7. 杀猪盘识别课                      finance      entry
 *   8. 兼职陷阱课 · 刷单/试衣员          experience   entry
 *   9. 数字藏品与虚拟币必修课            finance      advanced
 *  10. 维权路径必修课                    truth        entry
 *  11. 老年人保健品与"大师"陷阱课       other        entry
 */
import type { PrismaClient } from '@prisma/client';
import type { SeedModule } from './_shared';

interface VideoSeed {
  title: string;
  duration: number;        // 秒
  description: string;
  popup?: string;
}
interface QuizSeed {
  chapter: number;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}
interface CourseMeta {
  category: string;
  difficulty: 'entry' | 'intermediate' | 'advanced';
  targetAudience: 'all' | 'newcomer' | 'parent' | 'founder' | 'senior';
  summary: string;
  outcomes: string[];
  warningTips: string[];
}
interface CourseSeed {
  title: string;
  meta: CourseMeta;
  description: string;
  coverUrl: string;
  videos: VideoSeed[];
  quiz: QuizSeed[];
}

// ============== 课程画像 + 内容 ==============
const COURSE_SEEDS: CourseSeed[] = [
  {
    title: '直播行业真相课',
    meta: {
      category: 'truth',
      difficulty: 'entry',
      targetAudience: 'all',
      summary: '拆解直播行业真实收入结构，建立合理预期，识别幸存者偏差陷阱。',
      outcomes: [
        '看懂直播行业收入分布与真实回报周期',
        '识破"学员平均月入过万"等幸存者偏差话术',
        '理解起号需要的内容能力与试错成本',
        '掌握"冷静 24 小时"防冲动付费原则',
      ],
      warningTips: [
        '任何宣称"7 天起号"的课程都需警惕',
        '警惕"最后 3 天"等压缩决策时间的紧迫话术',
      ],
    },
    description:
      '系统讲解直播行业真实收入结构、能力要求与常见坑点，建立合理预期。免费视频课程，不承诺任何收益，个体效果差异极大。',
    coverUrl: 'https://picsum.photos/seed/truth/640/360',
    videos: [
      {
        title: '第1节：月入过万的直播主播，到底有多少？',
        duration: 480,
        description: '用公开数据拆解直播行业收入分布，认识幸存者偏差。',
        popup:
          '注意！这可能是套路：课程宣称"学员平均月入3万"，却从不展示收入分布数据。幸存者偏差下，只有极少数人晒单。先学完真相课，再看这类宣传，你会有全新判断。',
      },
      {
        title: '第2节：直播培训课卖的是什么？',
        duration: 520,
        description: '拆解高价培训课的成本结构：讲师、流量、话术与真实价值。',
        popup:
          '注意！这可能是套路：用"最后3天""名额有限"制造紧迫感，是为了让你来不及思考。任何课程都值得你冷静24小时再决定。',
      },
      {
        title: '第3节：0基础起号的真实周期',
        duration: 460,
        description: '起号需要的时间、内容能力与试错成本，建立合理预期。',
        popup:
          '注意！这可能是套路：宣称"7天起号、照做就行"，却回避账号定位、内容供给与平台算法的不确定性。真实周期以月为单位，且失败率极高。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '宣称"学员平均月入过万"的直播培训课，最可能隐瞒了什么？',
        options: ['收入分布数据', '讲师背景', '课程时长', '平台规则'],
        correctOption: 0,
        explanation: '平均数是典型的幸存者偏差话术，需要看收入中位数与分布，而非被放大的头部案例。',
      },
      {
        chapter: 3,
        question: '"最后3天、名额有限"这类话术的主要作用是什么？',
        options: ['传递真实稀缺性', '压缩你的决策时间', '展示课程质量', '维护学员权益'],
        correctOption: 1,
        explanation: '紧迫性话术的目标是让你在来不及核实的情况下快速付费，是典型的高风险信号。',
      },
    ],
  },
  {
    title: '韭菜体验营（直播版）',
    meta: {
      category: 'experience',
      difficulty: 'entry',
      targetAudience: 'all',
      summary: '用 AI 模拟"包装夸张但内容通用"的直播带货课，每节后弹窗拆解套路。',
      outcomes: [
        '体验典型直播培训话术包装套路',
        '识别"夸大标题 + 通用内容"的组合配方',
        '完成收益预期校准，调整对真实周期的判断',
      ],
      warningTips: [
        '体验课内容由 AI 模拟，不抄袭具体素材，重在套路结构',
        '完成课程不代表学会了带货，只有真实运营才能提升能力',
      ],
    },
    description:
      '用AI生成"真实有效但包装夸张"的直播培训体验课，每节后强制插入套路解析弹窗，并设置收益预期校准测试。',
    coverUrl: 'https://picsum.photos/seed/experience/640/360',
    videos: [
      {
        title: '体验课1：一部手机日赚500？来学真实方法论',
        duration: 420,
        description: '体验夸张包装的"带货变现"话术，随后弹窗拆解其套路结构。',
        popup:
          '套路解析：标题用"一部手机日赚500"博眼球，正文却只讲通用方法论。夸大标题 + 通用内容的组合，正是收割课程的常见配方。你学到的通用技能本身免费可寻，不必付费。',
      },
      {
        title: '体验课2：7天起号实战流程',
        duration: 500,
        description: '体验"快速起号"承诺，校准对真实周期的预期。',
        popup:
          '套路解析："7天起号"回避了内容供给、账号定位、平台算法的不确定性。请完成本章的收益预期校准测试，对比真实数据。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '你觉得"一部手机日赚500"的直播带货，头部主播占比大约是多少？',
        options: ['超过50%', '约10%', '不到1%', '人人可做到'],
        correctOption: 2,
        explanation: '直播带货收入高度集中于头部，绝大多数从业者收入低于社会平均，宣传"人人日赚500"属于典型夸大。',
      },
    ],
  },
  {
    title: '韭菜财商学院',
    meta: {
      category: 'finance',
      difficulty: 'intermediate',
      targetAudience: 'newcomer',
      summary: '免费提供基础理财知识，重点揭露金融骗局，不推荐任何具体金融产品。',
      outcomes: [
        '用数学拆解复利，理解"保本保息高收益"的不可能三角',
        '识别精神传销的封闭环境、身份洗白与高额收费信号',
        '建立基础金融反诈判断框架',
      ],
      warningTips: [
        '高收益 + 低风险 + 高流动性三者不可兼得，承诺即是危险信号',
        '任何要求"保密、远离家人"的"投资"都需立即报警',
      ],
    },
    description:
      '免费提供基础理财知识（复利、定投、保险、骗局识别），重点揭露金融骗局，不推荐任何具体金融产品。',
    coverUrl: 'https://picsum.photos/seed/finance/640/360',
    videos: [
      {
        title: '第1课：复利是神话还是常识？',
        duration: 450,
        description: '用数学拆解复利，认识"保本保息高收益"的不可能三角。',
        popup:
          '注意！这可能是套路：同时承诺"保本、保息、高收益"的理财课，几乎必然是骗局。金融学不存在不可能三角，收益与风险永远对等。',
      },
      {
        title: '第2课：如何识破精神传销的洗脑话术',
        duration: 540,
        description: '封闭环境、身份洗白、高额收费——识别精神传销的关键信号。',
        popup:
          '注意！这可能是套路：要求你"保密、远离家人、线下见面"的课程，正在切断你的社会支持系统。若家人突然迷上某"大师"并频繁要钱，请先查询其是否有前科。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '一个理财项目同时承诺"保本、年化20%、随时赎回"，你应当？',
        options: ['立即购买', '推荐给朋友', '保持警惕并核实资质', '加大投入'],
        correctOption: 2,
        explanation: '高收益、低风险、高流动性三者不可兼得，同时承诺即是危险信号，应核实资质并谨慎对待。',
      },
    ],
  },
  {
    title: '韭菜致富营',
    meta: {
      category: 'franchise',
      difficulty: 'intermediate',
      targetAudience: 'founder',
      summary: '免费提供创业/加盟基础知识，揭露"快招公司"套路，附紧急求助指引。',
      outcomes: [
        '识别加盟"快招公司"的五个信号',
        '掌握合同审查要点：违约责任、退出机制、费用明细',
        '学会用工商/涉诉/老加盟商三重核验方法',
      ],
      warningTips: [
        '快招公司常用"区域独家、快速回本"等话术，签约前必查',
        '合同中"甲方最终解释权"基本无效，但仍需律师审阅',
      ],
    },
    description:
      '免费提供创业/加盟基础知识（选址、算账、合同审查），揭露"快招公司"套路，设置风险校准与紧急求助指引。',
    coverUrl: 'https://picsum.photos/seed/franchise/640/360',
    videos: [
      {
        title: '第1课：加盟"快招公司"的五个信号',
        duration: 470,
        description: '从快招模式拆解加盟骗局：快速回本、区域独家、明星代言。',
        popup:
          '注意！这可能是套路：宣称"区域独家、快速回本"的加盟品牌，多数是快招公司。签约前务必查工商、查涉诉、查加盟商真实经营情况。',
      },
      {
        title: '第2课：加盟合同里最容易埋雷的条款',
        duration: 510,
        description: '合同审查入门：违约责任、退出机制、费用明细。',
        popup:
          '注意！这可能是套路：合同里"甲方最终解释权""违约金按年营业额30%计算"等条款极不公平。签约前请律师或法律援助审一遍。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '快招公司最典型的特征是什么？',
        options: [
          '加盟商盈利能力真实可查',
          '承诺"快速回本"且回避盈利数据',
          '提供完整合同审查',
          '接受第三方审计',
        ],
        correctOption: 1,
        explanation: '快招公司以"快速回本"话术吸引加盟，却回避真实盈利数据与加盟商经营情况。',
      },
    ],
  },
  {
    title: 'AI 韭菜课 · 2024',
    meta: {
      category: 'truth',
      difficulty: 'intermediate',
      targetAudience: 'all',
      summary: '拆解近两年高发的 AI 培训骗局：无人直播、AI 副业训练营、数字人带货。',
      outcomes: [
        '从平台规则/封号机制理解"AI 无人直播"的真实成本',
        '识破将免费工具包装为"独家电脑"的常见配方',
        '了解 AIGC 内容标识与数字人直播的法律边界',
      ],
      warningTips: [
        '宣称"全自动躺赚"的 AI 课几乎都需警惕',
        '数字人冒充真人违规多平台规则，存在封号+处罚风险',
      ],
    },
    description:
      '聚焦近两年兴起的新型 AI 培训骗局：AI 无人直播、AI 写脚本月入过万、AI 副业训练营。拆解其话术与底层逻辑，建立对"AI 万能"叙事的免疫力。',
    coverUrl: 'https://picsum.photos/seed/ai-trap/640/360',
    videos: [
      {
        title: '第1讲：无人直播真的可以"全自动躺赚"吗？',
        duration: 510,
        description: '从平台规则、封号机制、转化漏斗拆解"AI 无人直播"的真实成本。',
        popup:
          '注意！这可能是套路：宣称"一套软件 + 自动话术 = 24 小时自动赚钱"的课程，多以低价引流，再推销数千元"代理服务"。无人直播本质上需要持续运营与素材更新，没有"全自动"这回事。',
      },
      {
        title: '第2讲：用 AI 写脚本的真正价值与陷阱',
        duration: 470,
        description: 'AI 是工具，不是印钞机；拆解"AI 副业训练营"的常见话术结构。',
        popup:
          '注意！这可能是套路：把免费能用的 AI 工具包装成"内部版""独家电脑"高价售卖，是 AI 韭菜课最常见配方。学会用免费工具，你就不需要为他们付费。',
      },
      {
        title: '第3讲：AI 数字人直播的法律与平台红线',
        duration: 460,
        description: '数字人冒充真人、虚拟形象违规、平台对 AIGC 内容的标识要求。',
        popup:
          '注意！这可能是套路：以"数字人永不掉线"为卖点的服务，违反多平台关于真实身份与 AIGC 标识的规则，存在被封号、被处罚的双重风险。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '"AI 无人直播全自动躺赚"课程最可能隐瞒的是什么？',
        options: ['AI 模型的具体版本', '平台规则、封号率与持续运营成本', '老师的真实姓名', '课程时长'],
        correctOption: 1,
        explanation: 'AI 无人直播的关键风险在于平台合规与封号率，话术刻意回避这些可核查信息，是典型"信息不透明"套路。',
      },
      {
        chapter: 2,
        question: '把免费可用的 AI 工具包装成"独家电脑"高价售卖，属于？',
        options: ['合理知识付费', '典型的 AI 韭菜课配方', '官方授权内容', '平台扶持项目'],
        correctOption: 1,
        explanation: '将公开免费工具包装为"内部专享""独家电脑"高价售卖，是近两年 AI 培训最常见的收割套路。',
      },
    ],
  },
  {
    title: '未成年人充值退款必修课',
    meta: {
      category: 'truth',
      difficulty: 'entry',
      targetAudience: 'parent',
      summary: '专给家长看的避坑课：孩子充值打赏后，如何 0 成本走完平台-12315-报警-起诉全流程。',
      outcomes: [
        '第一时间保留完整证据（聊天截图、转账、平台记录、孩子承认视频）',
        '熟悉抖音/快手/微信小程序/游戏渠道四大申诉入口',
        '学会识破"维权中介"的二次收割套路',
      ],
      warningTips: [
        '关闭免密支付、Face ID 与小额免密，是家长必做设置',
        '"先交服务费，全额追回"的中介多为二次收割，请勿轻信',
      ],
    },
    description:
      '专给家长看的避坑课：孩子用父母手机充值游戏/直播打赏/打赏主播后怎么办？教你走平台申诉、12315、报警、起诉四步路径，附冷静期维权清单。',
    coverUrl: 'https://picsum.photos/seed/minor-refund/640/360',
    videos: [
      {
        title: '第1讲：第一时间该保留哪些证据？',
        duration: 440,
        description: '聊天截图、转账记录、平台充值记录、孩子承认视频——证据清单与取证要点。',
        popup:
          '注意！这可能是套路：所谓"专业维权机构"宣称"先交几百元服务费，全额追回"，多数是二次收割。本课教你 0 成本自助维权路径。',
      },
      {
        title: '第2讲：四大平台申诉流程对比',
        duration: 600,
        description: '抖音/快手/微信小程序/游戏渠道各自申诉入口、材料要求、成功率。',
        popup:
          '注意！这可能是套路：声称"内部渠道 100% 退费"的中介，往往是利用你的焦虑套取隐私。先看本课再决定要不要找外援。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '未成年人充值后第一时间最重要的事是？',
        options: ['找律师立刻起诉', '保留聊天/转账等证据并联系平台', '再充一次试试能不能退', '对孩子打骂'],
        correctOption: 1,
        explanation: '证据是退费成功率的关键，先截图/录屏保存，再按平台申诉—12315—报警—起诉的顺序处理。',
      },
    ],
  },

  // ===================== 新增 5 门 =====================
  {
    title: '杀猪盘识别课',
    meta: {
      category: 'finance',
      difficulty: 'entry',
      targetAudience: 'all',
      summary: '拆解"网恋 + 跨境投资"组合拳，看穿人设包装、小额返利、情绪操控三步陷阱。',
      outcomes: [
        '识别杀猪盘的人设包装与前期感情铺垫套路',
        '理解"诱导下载小众 App"绕过监管的真实目的',
        '掌握情绪操控的"未来家""首付"等施压话术',
        '熟悉 96110 反诈热线与证据保留要点',
      ],
      warningTips: [
        '凡网恋对象短期内让你下载陌生 App / 转账投资的，100% 是骗局',
        '小额返利能提现是"养肥再杀"的惯用伎俩，不构成信任依据',
      ],
    },
    description:
      '聚焦近年来高发的跨境杀猪盘：从相亲/社交平台接触、小额返利养信任、跨境投资/虚拟币平台卷款消失，全程拆解话术与心理操控步骤。',
    coverUrl: 'https://picsum.photos/seed/sashapan/640/360',
    videos: [
      {
        title: '第1讲：杀猪盘的 4 阶段时间线',
        duration: 500,
        description: '从"找猪—养猪—杀猪—跑路"四阶段，看清每个阶段的常见信号。',
        popup:
          '注意！这可能是套路：前期"嘘寒问暖"是为建立信任，恋爱人设是为后期大额转账铺路。任何拒绝视频见面的"高富帅/白富美"都需警惕。',
      },
      {
        title: '第2讲：小额返利是怎么让你上钩的',
        duration: 460,
        description: '为什么前几次提现"真到账"会让人放下警惕？',
        popup:
          '注意！这可能是套路：骗子用 3-5 次小额返利证明"平台能赚钱"，目的是让你加大本金。一旦本金达到阈值就拒绝提现，要求交"保证金/税"。',
      },
      {
        title: '第3讲：发现被骗，24 小时该做什么',
        duration: 540,
        description: '保留聊天记录、转账凭证、对方账号信息，按 96110 / 110 / 银行止付顺序处理。',
        popup:
          '注意！这可能是套路：所谓"黑客追回""内部渠道解冻"几乎都是二次诈骗，被骗后切勿再相信任何"追回中介"。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '杀猪盘前期"小额投资能提现"的目的是？',
        options: ['证明平台正规', '养信任、让你加大本金', '测试网速', '赠送福利'],
        correctOption: 1,
        explanation: '小额返利是"养猪"步骤，本质是建立信任诱饵；本金积累到阈值后骗子直接关闭提现。',
      },
      {
        chapter: 3,
        question: '发现自己掉进杀猪盘，正确的第一步是？',
        options: ['找"黑客追回"', '保存所有证据并报警 96110', '再投一次翻本', '继续谈感情'],
        correctOption: 1,
        explanation: '"黑客追回""内部渠道"几乎都是二次诈骗，必须先报警并保留全部聊天/转账记录。',
      },
    ],
  },
  {
    title: '兼职陷阱课 · 刷单/试衣员/打字员',
    meta: {
      category: 'experience',
      difficulty: 'entry',
      targetAudience: 'newcomer',
      summary: '面向学生、宝妈的兼职避坑课：识破刷单、试衣员、打字员、远程办公押金骗局。',
      outcomes: [
        '看穿"先垫资后返佣"刷单骗局的资金盘本质',
        '理解"试衣员/快递打包"为什么要你交押金',
        '识破"远程办公交材料费/工位费"的话术',
        '掌握被骗后如何与平台申诉并报警',
      ],
      warningTips: [
        '凡要求"先垫资/交押金/工位费"的兼职都是骗局',
        '"日结 300-500"的诱惑从不来自真实招聘平台',
      ],
    },
    description:
      '集中拆解学生与宝妈群体最常遇到的兼职骗局：刷单、试衣员、打字员、远程办公押金，以及藏在"完成任务返现"背后的资金盘结构。',
    coverUrl: 'https://picsum.photos/seed/parttime-trap/640/360',
    videos: [
      {
        title: '第1讲：刷单骗局是怎么用"小单"钓"大单"的',
        duration: 470,
        description: '从第 1 单 5 元返 7 元到第 8 单"连单任务"，资金盘逻辑一图看懂。',
        popup:
          '注意！这可能是套路：前几笔"立刻到账"是为建立信任，第 8/10 单开始的"连单任务"才是真正圈套——必须连做多单才能提现，而单笔金额会越滚越大。',
      },
      {
        title: '第2讲：试衣员/打包员为什么要你交押金',
        duration: 440,
        description: '"押金 + 工服费 + 培训费"三件套，是黑中介获利的核心套路。',
        popup:
          '注意！这可能是套路：合法兼职不会在入职前收取押金、工服费、培训费。任何要求"先转账才能排班"的岗位几乎都是骗局。',
      },
      {
        title: '第3讲：远程办公的"任务押金"陷阱',
        duration: 480,
        description: '"在家办公、操作简单、佣金日结"背后的资金盘与洗钱风险。',
        popup:
          '注意！这可能是套路：所谓远程任务经常被包装成"刷单 + 垫付"复合骗局，且部分"任务"可能涉及为黑产洗流水，自己也要承担法律责任。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '刷单骗局在"第 8 单"开始出现连单任务的目的是？',
        options: ['提高效率', '让你必须连做大额任务才能提现', '真实业务需要', '测试抗压能力'],
        correctOption: 1,
        explanation: '连单任务把小额试探升级为大额连环套，目的是在你无法中途撤退时"收割"。',
      },
      {
        chapter: 2,
        question: '遇到兼职要求先交"工服押金"，正确的做法是？',
        options: ['先交再排班', '直接离开并举报', '讨价还价要求优惠', '介绍朋友一起交'],
        correctOption: 1,
        explanation: '合法用工不允许收取押金。任何"先交后退"的承诺都不受法律保护，押金一旦支付基本无法追回。',
      },
    ],
  },
  {
    title: '数字藏品与虚拟币必修课',
    meta: {
      category: 'finance',
      difficulty: 'advanced',
      targetAudience: 'all',
      summary: '拆解数字藏品、NFT、虚拟币、空气币的常见骗局话术与监管红线。',
      outcomes: [
        '理解区块链/NFT/藏品三层概念的本质区别',
        '识破"内部额度""开盘必涨""百倍币"的话术',
        '熟悉我国对虚拟币交易、NFT 二级炒作的监管态度',
        '掌握被骗后证据链与司法追偿路径',
      ],
      warningTips: [
        '我国严禁虚拟币交易，"搬砖套利"几乎全是骗局',
        '数字藏品二级市场流动性极差，"稳赚保本"承诺不可信',
      ],
    },
    description:
      '深度课：从区块链基础到数字藏品/NFT/虚拟币交易骗局，拆解"开盘必涨""百倍币""搬砖套利"等高频话术，建立对 Web3 陷阱的辨识能力。',
    coverUrl: 'https://picsum.photos/seed/nft-crypto/640/360',
    videos: [
      {
        title: '第1讲：3 分钟搞懂 NFT / 数字藏品 / 虚拟币',
        duration: 600,
        description: '三者技术本质区别，监管态度差异，不可混淆的合规边界。',
        popup:
          '注意！这可能是套路：骗子经常故意混淆"NFT"与"虚拟币"概念，让你在不清楚监管时踏入禁区。一旦涉及人民币购买境外虚拟币，已经违法。',
      },
      {
        title: '第2讲："开盘必涨""百倍币"的数学真相',
        duration: 480,
        description: '从代币发行结构和持币集中度，看清任何"必涨"承诺都不成立。',
        popup:
          '注意！这可能是套路：所谓"内部额度"几乎全部来自项目方自有地址，谁接盘谁亏损。任何承诺具体涨幅的项目都是骗局。',
      },
      {
        title: '第3讲：搬砖套利与"境外平台"陷阱',
        duration: 530,
        description: '跨平台价差套利听起来很美，实为资金盘+合约盘多层陷阱。',
        popup:
          '注意！这可能是套路：所谓"搬砖"实际操作时要么遇到虚假深度、要么需要持续追加保证金。我国严禁境内参与任何虚拟币交易，发现请立即远离。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '"百倍币""开盘必涨"的承诺，本质上违反了什么？',
        options: ['民族传统', '基本金融逻辑：收益与风险对等', '代码规范', '服务器稳定性'],
        correctOption: 1,
        explanation: '金融学铁律之一就是收益与风险对等，"必涨"承诺本身就违反基本规律，是资金盘典型话术。',
      },
      {
        chapter: 3,
        question: '在我国境内参与境外虚拟币交易，可能面临？',
        options: ['完全无风险', '法律风险与资金风险双重叠加', '被国家奖励', '自动免税'],
        correctOption: 1,
        explanation: '我国严禁虚拟币交易撮合与定价，境内参与境外平台交易存在法律与资金双重风险。',
      },
    ],
  },
  {
    title: '维权路径必修课',
    meta: {
      category: 'truth',
      difficulty: 'entry',
      targetAudience: 'all',
      summary: '一份被骗后的标准化四步走：证据 → 平台/商家 → 投诉 → 司法。',
      outcomes: [
        '知道第一时间保留哪些证据才不会"哑巴吃黄连"',
        '熟悉 12315 / 96110 / 110 / 国家信访等官方通道',
        '掌握小额诉讼起诉流程与成本预期',
        '识别"维权中介"的二次收割套路',
      ],
      warningTips: [
        '切勿相信"先交服务费再全额追回"的中介',
        '取证要趁早，聊天记录与转账凭证最容易过期失效',
      ],
    },
    description:
      '被骗后第一时间该做什么？本课按"证据保留—平台申诉—行政投诉—司法追偿"四步走给出可执行的清单与时间节点。',
    coverUrl: 'https://picsum.photos/seed/legal-aid/640/360',
    videos: [
      {
        title: '第1讲：黄金 24 小时，证据清单与取证方式',
        duration: 540,
        description: '聊天截图、转账流水、对方账号、合同/凭证——4 类证据的取证要点。',
        popup:
          '注意！这可能是套路："维权机构"宣称无条件帮你取证收费 30%，多半是二次收割。先学方法、必要时再找律师。',
      },
      {
        title: '第2讲：12315 / 96110 / 平台客服，哪个先打？',
        duration: 460,
        description: '区分投诉、举报、紧急止付，按风险等级排序处理顺序。',
        popup:
          '注意！这可能是套路：所谓"110 转接中心"电话几乎都是改号诈骗，正规报警请直接拨打或前往派出所。',
      },
      {
        title: '第3讲：小额诉讼与互联网法院操作指南',
        duration: 600,
        description: '1 万元以下争议适用小额诉讼，成本低、周期短、操作简单。',
        popup:
          '注意！这可能是套路：起诉前请先通过律师或法律援助中心核对被告信息，避免"被告信息错误"被驳回。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '被骗后第一优先做的事是？',
        options: ['先报警再取证', '保留证据再联系平台/110', '等几天冷静', '找网红曝光'],
        correctOption: 1,
        explanation: '证据是后续所有维权行为的基础，聊天记录、转账凭证过期会失效，应第一优先保留。',
      },
      {
        chapter: 2,
        question: '对"维权中介"宣称"先交服务费，全额追回"应？',
        options: ['可考虑', '立即识破并远离', '讨价还价', '仅签小额合同'],
        correctOption: 1,
        explanation: '几乎所有"维权中介"都是二次收割。真正可信的律师通常先谈方案再签合同，不预收大额服务费。',
      },
    ],
  },
  {
    title: '老年人保健品与"大师"陷阱课',
    meta: {
      category: 'other',
      difficulty: 'entry',
      targetAudience: 'senior',
      summary: '为家中长辈准备的识骗课：保健品、活馆藏拍、伪国学大师、感恩亲情洗脑四类骗局。',
      outcomes: [
        '看穿保健品虚假宣传的"蓝帽子""教授"虚假背书',
        '识破"免费旅游 + 集中会销 + 亲情牌"组合套路',
        '理解伪国学/大师班的封闭环境与精神控制机制',
        '掌握劝导家人时不破关系的沟通策略',
      ],
      warningTips: [
        '凡要求"保密、不告诉家人"的老师/课程都需警惕',
        '凡是"免费送鸡蛋/旅游"背后都有营销目标',
      ],
    },
    description:
      '为长辈 & 子女准备的防割课。系统拆解保健品、活馆藏拍、感恩亲情洗脑、伪国学/大师班的常见套路,提供可执行的劝导话术与报警路径。',
    coverUrl: 'https://picsum.photos/seed/senior-trap/640/360',
    videos: [
      {
        title: '第1讲：保健品的"蓝帽子"陷阱',
        duration: 460,
        description: '保健食品与药品的本质区别，"教授""老中医"虚假身份识别。',
        popup:
          '注意！这可能是套路：拥有"蓝帽子"标志只代表是保健食品，不是药。宣称"治疗高血压/糖尿病"的保健品广告均为违法。',
      },
      {
        title: '第2讲：免费旅游 + 集中会销',
        duration: 500,
        description: '从"鸡蛋、挂面、按摩仪"到"交几万当弟子"的 7 步套路。',
        popup:
          '注意！这可能是套路：所谓免费旅游实际是"封闭环境会销"——通过限制外出、营造氛围完成从众与依赖，是典型精神控制前奏。',
      },
      {
        title: '第3讲：如何劝导长辈又不破关系',
        duration: 540,
        description: '从情感需求切入，引入第三方权威，避免硬刚导致的对抗升级。',
        popup:
          '注意！这可能是套路：让长辈直接相信"你被骗了"几乎不可能。建议联合社区民警、家庭医生等第三方力量劝说。',
      },
    ],
    quiz: [
      {
        chapter: 1,
        question: '拥有"蓝帽子"标志意味着？',
        options: ['是药品', '是保健食品，不是药', '可治疗慢性病', '国家补贴品'],
        correctOption: 1,
        explanation: '"蓝帽子"代表保健食品，宣称"治疗"功能本身已违反《广告法》，需警惕虚假宣传。',
      },
      {
        chapter: 3,
        question: '劝导长辈不要靠什么？',
        options: ['联合社区民警/医生', '硬刚与指责', '倾听与陪伴', '官方案例分享'],
        correctOption: 1,
        explanation: '直接指责容易激发防御心理；联合可信的第三方权威，提供真实案例与耐心陪伴效果更稳。',
      },
    ],
  },
];

// ============== 执行 ==============
export const seedCourses: SeedModule = async (prisma) => {
  for (const c of COURSE_SEEDS) {
    const { videos, quiz, meta, ...fields } = c;
    const estimatedMinutes = Math.round(
      videos.reduce((sum, v) => sum + v.duration, 0) / 60,
    );
    const payload = {
      ...fields,
      ...meta,
      estimatedMinutes,
    };

    const existing = await prisma.course.findFirst({ where: { title: c.title } });

    let courseId: number;
    if (existing) {
      courseId = existing.id;
      // 已存在课程：补齐新字段（包括之前缺漏的），同时不重置 learnerCount
      await prisma.course.update({
        where: { id: courseId },
        data: {
          category: payload.category,
          difficulty: payload.difficulty,
          targetAudience: payload.targetAudience,
          summary: payload.summary,
          outcomes: payload.outcomes,
          warningTips: payload.warningTips,
          estimatedMinutes,
          // description / coverUrl / isFree 同步（保持一致）
          description: payload.description,
          coverUrl: payload.coverUrl,
          isFree: true,
        },
      });
      console.log(`     ↻ 已更新画像: ${c.title}（${videos.length} 节, ${quiz.length} 题, ~${estimatedMinutes} 分钟）`);
    } else {
      const created = await prisma.course.create({
        data: {
          ...payload,
          isFree: true,
          learnerCount: Math.floor(Math.random() * 800) + 200,
        },
      });
      courseId = created.id;
      console.log(`     + 新增课程: ${c.title}（${videos.length} 节, ${quiz.length} 题, ~${estimatedMinutes} 分钟）`);
    }

    // —— 视频：按 (courseId, title) 探测后写入 ——
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      const dup = await prisma.video.findFirst({
        where: { courseId, title: v.title },
      });
      if (dup) continue;
      const video = await prisma.video.create({
        data: {
          courseId,
          title: v.title,
          duration: v.duration,
          description: v.description,
          order: i + 1,
          coverUrl: `https://picsum.photos/seed/${c.meta.category}-${i + 1}-${Date.now() % 1000}/640/360`,
          videoUrl: 'https://www.douyin.com/',
        },
      });
      if (v.popup) {
        await prisma.popup.upsert({
          where: { videoId: video.id },
          update: { content: v.popup },
          create: { videoId: video.id, content: v.popup },
        });
      }
    }

    // —— 测试题：按 (courseId, question) 探测后写入 ——
    for (const q of quiz) {
      const dup = await prisma.quizQuestion.findFirst({
        where: { courseId, question: q.question },
      });
      if (dup) continue;
      await prisma.quizQuestion.create({
        data: {
          courseId,
          chapter: q.chapter,
          question: q.question,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
        },
      });
    }
  }
};
