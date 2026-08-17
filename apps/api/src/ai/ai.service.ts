import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RISK_DIMENSIONS, RISK_LEXICON, HIGH_RISK_TRIGGERS } from '@jiucaibox/shared';
import { RiskDimension, RiskLevel, RiskPoint } from '@jiucaibox/shared';

export interface AiInput {
  sourceUrl?: string;
  sourceType?: string;
  inputText: string;
}

export interface AiResult {
  riskLevel: RiskLevel;
  riskPoints: RiskPoint[];
  dimensions: RiskDimension[];
  analysis: string;
  recommendation: string;
}

export interface DeepResult {
  deepRiskLevel: RiskLevel;
  alert: boolean;
  summary: string;
}

interface LexiconEntry {
  category: string;
  weight: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private cache = new Map<string, AiResult>();

  constructor(private readonly prisma: PrismaService) {}

  /** 入口：有 DEEPSEEK_API_KEY 时优先调用大模型，失败/未配置时回退本地规则引擎 */
  async analyze(input: AiInput): Promise<AiResult> {
    const cacheKey = input.sourceUrl
      ? `url:${input.sourceUrl}`
      : `text:${this.hash(input.inputText)}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    let result: AiResult | null = null;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        result = await this.deepSeekAnalyze(input);
        this.logger.log('AI 测评由 DeepSeek 完成');
      } catch (e: any) {
        this.logger.warn(`DeepSeek 调用失败，回退规则引擎: ${e.message}`);
      }
    }
    if (!result) {
      result = await this.ruleAnalyze(input);
      this.logger.log('AI 测评由本地规则引擎完成');
    }
    if (this.cache.size > 500) this.cache.clear();
    this.cache.set(cacheKey, result);
    return result;
  }

  /** 深度接洽综合评估 */
  deepEvaluate(
    feedback: { step: number; question: string; answer: 'yes' | 'no' | 'unsure' }[],
  ): DeepResult {
    const highRiskSteps = new Set([0, 1, 2, 3, 5]); // 对应 DEEP_STEPS 中的高风险项
    let score = 0;
    let alert = false;
    let yesCount = 0;
    for (const f of feedback) {
      const weight = highRiskSteps.has(f.step - 1) ? 2 : 1;
      if (f.answer === 'yes') {
        score += weight * 2;
        yesCount += 1;
        if (highRiskSteps.has(f.step - 1)) alert = true;
      } else if (f.answer === 'unsure') {
        score += weight * 1;
      }
    }
    let deepRiskLevel: RiskLevel = 'low';
    if (alert || score >= 10) deepRiskLevel = 'high';
    else if (score >= 5) deepRiskLevel = 'medium';

    const summary =
      deepRiskLevel === 'high'
        ? `检测到 ${yesCount} 个高风险信号（含贷款/紧迫性/收益承诺等）。强烈建议立即停止接洽，保留证据，拨打 12315 或 110，并联系家人朋友。`
        : deepRiskLevel === 'medium'
          ? `检测到 ${yesCount} 个风险信号。对方存在一定可疑特征，建议暂缓付款，先完成相关真相课学习再决定。`
          : `暂未发现明显高风险信号，但仍建议保持警惕，付款前先核实对方资质。`;

    return { deepRiskLevel, alert, summary };
  }

  // ---------- 本地规则引擎 ----------
  private async ruleAnalyze(input: AiInput): Promise<AiResult> {
    const text = input.inputText || input.sourceUrl || '';
    const lexicon = await this.loadLexicon();

    const matches = new Map<string, { count: number; evidence: string; weight: number }>();
    const triggerHit = HIGH_RISK_TRIGGERS.some((w) => text.includes(w));

    for (const [word, entry] of lexicon) {
      if (!word) continue;
      let idx = text.indexOf(word);
      let count = 0;
      while (idx !== -1 && count < 20) {
        count++;
        idx = text.indexOf(word, idx + word.length);
      }
      if (count > 0) {
        const cur = matches.get(entry.category) || { count: 0, evidence: '', weight: entry.weight };
        cur.count += count;
        if (!cur.evidence) {
          const i = text.indexOf(word);
          cur.evidence = text.slice(Math.max(0, i - 12), Math.min(text.length, i + word.length + 12));
        }
        matches.set(entry.category, cur);
      }
    }

    const riskPoints: RiskPoint[] = [];
    const dimensions: RiskDimension[] = [];
    let totalScore = 0;
    for (const dim of RISK_DIMENSIONS) {
      const m = matches.get(dim.key);
      const score = m ? Math.min(100, Math.round(m.count * m.weight * 15)) : 0;
      dimensions.push({ name: dim.name, score });
      totalScore += m ? m.count * m.weight : 0;
      if (m) {
        riskPoints.push({
          type: dim.name,
          evidence: m.evidence.trim(),
          count: m.count,
        });
      }
    }

    let riskLevel: RiskLevel = 'low';
    if (triggerHit || totalScore >= 8) riskLevel = 'high';
    else if (totalScore >= 3) riskLevel = 'medium';

    const topTypes = riskPoints.slice(0, 3).map((p) => p.type).join('、') || '暂无典型风险词';
    const analysis =
      riskLevel === 'high'
        ? `该内容在「${topTypes}」方面出现明显夸大或诱导特征，且${
            triggerHit ? '涉及贷款/先交钱等高风险行为，' : ''
          }与常见割韭菜套路高度吻合。请谨慎对待，切勿在未核实的情况下付款。`
        : riskLevel === 'medium'
          ? `该内容存在「${topTypes}」等可疑特征，夸大与诱导成分较多，建议多方核实后再做决定。`
          : `该内容未检出明显高风险特征，但仍建议保持警惕：任何承诺收益的内容都需核实资质与来源。`;

    const recommendation =
      riskLevel === 'high'
        ? '建议谨慎对待：先学习《直播行业真相课》第3节了解此类话术；如已涉及付款或贷款，请立即停止并拨打 12315 / 110，保留聊天与转账证据。'
        : riskLevel === 'medium'
          ? '建议先学习《韭菜体验营》了解常见套路结构，再进行下一步接触。'
          : '可继续了解，但请记住：不承诺收益、信息透明、资质可查，是判断正规课程的基本标准。';

    return { riskLevel, riskPoints, dimensions, analysis, recommendation };
  }

  private async loadLexicon(): Promise<Map<string, LexiconEntry>> {
    const map = new Map<string, LexiconEntry>();
    // 优先使用数据库词库（后台可维护），无数据时回退内置词库
    const words = await this.prisma.riskWord.findMany({ where: { active: true } });
    if (words.length > 0) {
      for (const w of words) {
        map.set(w.word, { category: w.category, weight: w.weight });
      }
      return map;
    }
    for (const cat of RISK_LEXICON) {
      for (const word of cat.words) {
        map.set(word, { category: cat.key, weight: cat.weight });
      }
    }
    return map;
  }

  // ---------- DeepSeek（OpenAI 兼容协议） ----------
  private async deepSeekAnalyze(input: AiInput): Promise<AiResult> {
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    const userText = [
      input.sourceUrl ? `来源链接: ${input.sourceUrl}` : '',
      input.inputText ? `内容文本: ${input.inputText}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const system = [
      '你是一个反割韭菜风险分析助手，服务于公益防割教育平台"韭菜学院"。',
      '对用户提交的课程/视频/营销文案进行风险特征分析。',
      '规则：只输出风险特征与风险等级，不做"骗子"等定性判断；',
      '输出严格为 JSON，格式：',
      '{"risk_level":"high|medium|low","risk_points":[{"type":"风险类型","evidence":"证据文本片段","count":出现次数}],"dimensions":[{"name":"收益承诺","score":0-100},{"name":"焦虑话术","score":0-100},{"name":"虚假案例","score":0-100},{"name":"信息不透明","score":0-100},{"name":"合规性","score":0-100}],"analysis":"分析结论","recommendation":"行动建议"}',
      '风险类型示例：收益承诺、焦虑话术、虚假案例、信息不透明、合规性。',
    ].join('');

    const resp = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content: string = resp.data?.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    const riskLevel: RiskLevel = ['high', 'medium', 'low'].includes(parsed.risk_level)
      ? parsed.risk_level
      : 'medium';
    const riskPoints: RiskPoint[] = Array.isArray(parsed.risk_points)
      ? parsed.risk_points.map((p: any) => ({
          type: String(p.type || '未知'),
          evidence: String(p.evidence || ''),
          count: Number(p.count) || 1,
        }))
      : [];
    const dimNames = RISK_DIMENSIONS.map((d) => d.name);
    const dimensions: RiskDimension[] = Array.isArray(parsed.dimensions) && parsed.dimensions.length
      ? parsed.dimensions.map((d: any) => ({
          name: String(d.name || ''),
          score: Math.max(0, Math.min(100, Number(d.score) || 0)),
        }))
      : dimNames.map((name) => ({ name, score: 0 }));
    // 补全缺失维度
    for (const name of dimNames) {
      if (!dimensions.some((d) => d.name === name)) dimensions.push({ name, score: 0 });
    }

    return {
      riskLevel,
      riskPoints,
      dimensions,
      analysis: String(parsed.analysis || ''),
      recommendation: String(parsed.recommendation || ''),
    };
  }

  private hash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return String(h);
  }
}
