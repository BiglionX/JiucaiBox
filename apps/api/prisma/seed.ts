/**
 * 韭菜学院 / JiucaiBox 种子数据
 * 执行: npm run db:seed  (workspace apps/api)
 * 生成: 管理账号、演示课程/视频/弹窗/测试题、电台、故事、风险词库、演示用户
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RISK_LEXICON, TRICK_TAGS_SEED } from '@jiucaibox/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('开始写入种子数据...');

  // ---------- 管理账号 ----------
  const adminUsername = process.env.ADMIN_INIT_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_INIT_PASSWORD || 'jiucai123456';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: adminHash,
      nickname: '超级管理员',
      role: 'super_admin',
    },
  });
  console.log(`✔ 管理账号 ${adminUsername} / ${adminPassword}`);

  // ---------- 演示用户 ----------
  const demo = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      nickname: '韭菜A001',
      avatar: '',
      bio: '想搞清直播培训的水有多深',
      isAnonymous: true,
    },
  });
  console.log(`✔ 演示用户 ${demo.nickname} (13800138000)`);

  // ---------- 课程与视频 ----------
  const coursesData = [
    {
      title: '直播行业真相课',
      category: 'truth',
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
      category: 'experience',
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
      category: 'finance',
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
      category: 'franchise',
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
  ];

  for (const courseData of coursesData) {
    const { videos, quiz, ...courseFields } = courseData;
    const course = await prisma.course.create({
      data: {
        ...courseFields,
        learnerCount: Math.floor(Math.random() * 800) + 200,
      },
    });

    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      const video = await prisma.video.create({
        data: {
          courseId: course.id,
          title: v.title,
          duration: v.duration,
          description: v.description,
          order: i + 1,
          coverUrl: `https://picsum.photos/seed/${course.category}-${i + 1}/640/360`,
          videoUrl: 'https://www.douyin.com/', // 演示占位链接，正式录入时替换为真实视频链接
        },
      });
      if (v.popup) {
        await prisma.popup.create({
          data: { videoId: video.id, content: v.popup },
        });
      }
    }

    for (const q of quiz) {
      await prisma.quizQuestion.create({
        data: {
          courseId: course.id,
          chapter: q.chapter,
          question: q.question,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
        },
      });
    }
    console.log(`✔ 课程: ${course.title}（${videos.length} 节视频, ${quiz.length} 道测试题）`);
  }

  // ---------- 韭菜电台 ----------
  await prisma.radioEpisode.create({
    data: {
      title: '创刊号：传销头目出狱后变"国学大师"，如是书院已关停',
      sourceUrl: 'https://www.baidu.com/',
      sourceLabel: '权威媒体',
      summary:
        '浙江新昌"如是书院"违法经营已被关停，赖某明等3人虐待学员被刑拘。传销头目出狱后借"传统文化""修行"包装传销本质，重新收割。',
      tricks: [
        {
          name: '身份洗白',
          description: '利用"传统文化""修行"包装传销本质，回避真实履历。',
        },
        {
          name: '精神控制',
          description: '封闭环境切断外界联系，逐步洗脑，要求保密、远离家人。',
        },
        {
          name: '高额收费 + 暴力威胁',
          description: '交钱只是开始，不服从就虐待，甚至逼学员贷款。',
        },
      ],
      warning:
        '家人若突然迷上某"大师"并频繁要钱，请先查询其是否有前科，并警惕精神传销。可拨打 12315 或向公安机关举报。',
    },
  });
  await prisma.radioEpisode.create({
    data: {
      title: '第2期："AI无人直播躺赚"的真相',
      sourceUrl: 'https://www.baidu.com/',
      sourceLabel: '官方通报',
      summary:
        '多地市场监管部门通报"无人直播躺赚"培训骗局：以低价课引流，再推销数千元"代理"服务，最终无法兑现承诺。',
      tricks: [
        {
          name: '低价引流',
          description: '9.9元体验课吸引报名，再话术升级推销高价服务。',
        },
        {
          name: '夸大承诺',
          description: '"全自动赚钱、无需运营"，回避平台规则与封号风险。',
        },
        {
          name: '催促付款',
          description: '"最后3天""名额有限"制造紧迫感，压缩决策时间。',
        },
      ],
      warning: '任何宣称"全自动躺赚"的项目都需警惕，建议先用反割测评工具免费检测再决定。',
    },
  });
  console.log('✔ 电台: 2 期');

  // ---------- 韭菜的泪花 ----------
  await prisma.story.create({
    data: {
      userId: demo.id,
      userNickname: '韭菜B072',
      category: 'finance',
      lossAmount: 20000,
      lossTypes: ['money', 'mental'],
      title: '被某财商课割了2万：我花光积蓄买了一个"财务自由"梦',
      content:
        '去年失业后刷到一门财商课，宣称"学会复利思维，3年实现财务自由"。我花2万报了名，课程内容却全是网上免费的理财常识。老师不停推销更高价位的"私教班"，我拒绝后就被冷落。现在回想，最贵的不是学费，是我浪费的一年时间。',
      lesson: '任何课程都不会承诺收益，先学免费的真相课，再决定要不要付费。',
      status: 'approved',
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
  });
  await prisma.story.create({
    data: {
      userId: demo.id,
      userNickname: '韭菜C315',
      category: 'live',
      lossAmount: 9800,
      lossTypes: ['money', 'time', 'family'],
      title: '9800元的"7天起号"课，我至今没起出一个号',
      content:
        '培训机构承诺"7天起号、月入过万"，我交完钱才发现教学内容全是抖音官方免费教程的拼凑。说好的"老师一对一"加了微信后就不回消息，退款无门。为了凑学费我还借了花呗，家里人知道后吵了很久。',
      lesson: '起号没有捷径，警惕任何"短时间高回报"的承诺，先看真实收入分布数据。',
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000),
    },
  });
  await prisma.story.create({
    data: {
      userId: demo.id,
      userNickname: '韭菜D888',
      category: 'franchise',
      lossAmount: 150000,
      lossTypes: ['money', 'family'],
      title: '加盟奶茶店半年，我赔光15万积蓄',
      content:
        '总部承诺"区域独家、快速回本"，签约后发现所谓供应链价格比市场贵30%，加盟商之间恶性竞争，总部还频繁要求进货。合同里"最终解释权归甲方"，维权无门。',
      lesson: '加盟前务必查工商、查涉诉、实地考察老加盟商，合同请律师审。',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000),
    },
  });
  console.log('✔ 故事: 3 条（2 已发布 + 1 待审）');

  // ---------- 风险词库 ----------
  for (const cat of RISK_LEXICON) {
    for (const word of cat.words) {
      await prisma.riskWord.upsert({
        where: { word_category: { word, category: cat.key } },
        update: {},
        create: { word, category: cat.key, weight: cat.weight },
      });
    }
  }
  console.log('✔ 风险词库: ' + RISK_LEXICON.reduce((n, c) => n + c.words.length, 0) + ' 词条');

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
