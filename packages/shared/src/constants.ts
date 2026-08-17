/**
 * 韭菜学院 / JiucaiBox 全局常量（三端共用）
 */

// ---------- 品牌与文案 ----------
export const BRAND = {
  name: '韭菜学院',
  enName: 'JiucaiBox',
  slogan: '每一滴泪花，都是路标',
};

// ---------- 风险等级 ----------
export const RISK_LEVEL_META: Record<
  'high' | 'medium' | 'low',
  { label: string; color: string; bgColor: string }
> = {
  high: { label: '高风险', color: '#F44336', bgColor: '#FDECEA' },
  medium: { label: '中风险', color: '#FF9800', bgColor: '#FFF3E0' },
  low: { label: '低风险', color: '#4CAF50', bgColor: '#E8F5E9' },
};

export const RISK_LEVELS = ['high', 'medium', 'low'] as const;

// ---------- 课程难度档位 ----------
export const COURSE_DIFFICULTY_ORDER: ReadonlyArray<'entry' | 'intermediate' | 'advanced'> = [
  'entry',
  'intermediate',
  'advanced',
];

// ---------- 适用人群档位 ----------
export const TARGET_AUDIENCE_ORDER: ReadonlyArray<
  'all' | 'newcomer' | 'parent' | 'founder' | 'senior'
> = ['all', 'newcomer', 'parent', 'founder', 'senior'];

// ---------- 测评维度（风险雷达图） ----------
export const RISK_DIMENSIONS = [
  { key: 'income', name: '收益承诺' },
  { key: 'urgency', name: '焦虑话术' },
  { key: 'fakeCase', name: '虚假案例' },
  { key: 'opaque', name: '信息不透明' },
  { key: 'compliance', name: '合规性' },
] as const;

export const DIMENSION_LABELS: Record<string, string> = {
  income: '收益承诺',
  urgency: '焦虑话术',
  fakeCase: '虚假案例',
  opaque: '信息不透明',
  compliance: '合规性',
};

// ---------- 深度接洽避坑清单（分步问题） ----------
export const DEEP_STEPS: { question: string; highRisk?: boolean }[] = [
  { question: '对方是否承诺了具体收益（如"月入过万""稳赚"）？', highRisk: true },
  { question: '是否出现"名额有限、今天必须定"等紧迫性话术？', highRisk: true },
  { question: '是否要求你提供身份证、银行卡或办理贷款？', highRisk: true },
  { question: '是否要求先交钱再签合同，或合同条款模糊？', highRisk: true },
  { question: '对方是否能提供可查证的公司资质与合同备案？' },
  { question: '是否暗示"老师一对一私聊"或要求远离家人朋友？', highRisk: true },
];

export const DEEP_STEP_COUNT = DEEP_STEPS.length;

// ---------- 匿名昵称 ----------
export const ANONYMOUS_NICKNAME_PREFIX = '韭菜';
export const ANONYMOUS_SUFFIX_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ---------- 紧急提示 ----------
export const EMERGENCY_TEXT =
  '请立即停止支付，保留证据（聊天记录、转账凭证、合同），拨打 12315 或 110，并联系家人朋友。';

// ---------- 免责声明 ----------
export const DISCLAIMER =
  '本分析仅供教育参考，不构成事实认定或法律意见。内容由 AI 生成，结果可能存在偏差。';

export const COURSE_DISCLAIMER = '本课程不承诺任何收益，个体效果差异极大。';

// ---------- 视频外链白名单（后台校验） ----------
export const VIDEO_URL_WHITELIST = [
  'douyin.com',
  'v.douyin.com',
  'iesdouyin.com',
  'weixin.qq.com',
  'channels.weixin.qq.com',
  'wx.qq.com',
  'qq.com',
  'bilibili.com',
  'b23.tv',
  'youtube.com',
  'youtu.be',
];

// ---------- 通用分页 ----------
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

// ---------- 平台限制 ----------
export const LIMITS = {
  nicknameMin: 2,
  nicknameMax: 12,
  bioMax: 50,
  storyContentMin: 10,
  storyContentMax: 5000,
  commentMax: 500,
  analysisInputMax: 2000,
  notificationsKeep: 100,
};
