/**
 * 风险词库：用于本地规则引擎（无大模型 Key 时的测评回退）与后台词库管理种子数据。
 * 与《管理后台说明书》4.8 风险词库一致，按测评维度分类。
 */

export interface RiskLexiconCategory {
  key: string; // 对应 DIMENSION_LABELS 的 key
  label: string;
  words: string[];
  weight: number;
}

export const RISK_LEXICON: RiskLexiconCategory[] = [
  {
    key: 'income',
    label: '收益承诺',
    weight: 2,
    words: [
      '月入过万', '日赚', '躺赚', '暴富', '年入百万', '轻松月入', '一部手机',
      '副业赚钱', '0基础赚钱', '快速回本', '保本', '稳赚', '翻倍', '财务自由',
      '睡后收入', '被动收入', '自动赚钱', '不用努力', '躺着赚钱', '日入', '无本万利',
      '月入十万', '日入过千', '轻松赚',
    ],
  },
  {
    key: 'urgency',
    label: '焦虑话术',
    weight: 1.5,
    words: [
      '最后3天', '最后三天', '名额有限', '限时', '秒杀', '错过', '立即报名',
      '今天必须', '倒计时', '仅剩', '手慢无', '涨价', '恢复原价', '马上截止',
      '错过再等一年', '仅此一次', '内部名额',
    ],
  },
  {
    key: 'fakeCase',
    label: '虚假案例',
    weight: 1.5,
    words: [
      '学员反馈', '学员收益', '真实案例', '截图', '晒单', '转账记录', '我们的学员',
      '已帮助万人', '成功案例', '学员见证', '跟着做就能', '照做就行', '案例展示',
    ],
  },
  {
    key: 'opaque',
    label: '信息不透明',
    weight: 1.5,
    words: [
      '内幕', '内部渠道', '独家', '机密', '不能外传', '老师一对一', '加微信',
      '私聊', '保密协议', '线下见面', '内部消息', '绝密', '仅限内部',
    ],
  },
  {
    key: 'compliance',
    label: '合规性',
    weight: 2,
    words: [
      '保证', '保过', '包过', '100%', '百分百', '稳赚不赔', '绝对安全', '无风险',
      '稳收益', '承诺收益', '无任何风险', '包教包会', '签合同保赚', '零风险',
    ],
  },
];

/** 高风险触发词（命中任一即触发紧急提示 / 升级风险等级） */
export const HIGH_RISK_TRIGGERS = [
  '贷款', '借钱', '信用卡', '花呗', '借呗', '网贷', '征信', '抵押', '分期付',
  '先交钱', '交定金', '预付', '刷信用卡', '透支', '借钱交学费', '贷款交学费',
];

/** 隐私敏感信息（故事/评论图片打码关键词，MVP 阶段文案提示） */
export const PRIVACY_SENSITIVE = ['身份证', '银行卡', '手机号', '住址', '账号', '密码'];

/** 后台词库种子：套路标签库 */
export const TRICK_TAGS_SEED = [
  { name: '快招公司', description: '以"快速招商、快速回本"为诱饵的加盟骗局', keywords: ['快招', '加盟回本', '区域代理'], relatedCategory: 'franchise' },
  { name: '精神传销', description: '利用封闭环境与精神控制实现收割', keywords: ['大师', '洗脑', '封闭', '修行'], relatedCategory: 'other' },
  { name: '杀猪盘', description: '以恋爱/交友为名诱导投资', keywords: ['投资', '交友', '带你赚'], relatedCategory: 'finance' },
  { name: '带货培训割韭菜', description: '高价直播带货课，承诺涨粉变现', keywords: ['起号', '涨粉', '带货变现'], relatedCategory: 'live' },
  { name: '财商课杀猪', description: '高价财商课卖"财务自由"焦虑', keywords: ['财务自由', '财商', '复利'], relatedCategory: 'finance' },
];

export function buildLexiconMap(): Map<string, { category: string; weight: number }> {
  const map = new Map<string, { category: string; weight: number }>();
  for (const cat of RISK_LEXICON) {
    for (const word of cat.words) {
      map.set(word, { category: cat.key, weight: cat.weight });
    }
  }
  return map;
}
