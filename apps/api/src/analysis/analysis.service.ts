import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AnalysisReport } from '@jiucaibox/shared';
import { LIMITS } from '@jiucaibox/shared';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /** 提交测评：入库后同步执行 AI 分析 */
  async create(
    userId: number | undefined,
    dto: { sourceUrl?: string; sourceType?: string; inputText?: string },
  ): Promise<AnalysisReport> {
    const sourceUrl = (dto.sourceUrl || '').trim();
    const inputText = (dto.inputText || '').trim();
    if (!sourceUrl && !inputText) {
      throw new BadRequestException('请提供测评链接或粘贴文案内容');
    }
    if (inputText.length > LIMITS.analysisInputMax) {
      throw new BadRequestException(`内容过长，请控制在 ${LIMITS.analysisInputMax} 字以内`);
    }

    const report = await this.prisma.analysisReport.create({
      data: {
        userId: userId ?? null,
        sourceUrl: sourceUrl || null,
        sourceType: dto.sourceType || (sourceUrl ? 'video' : 'article'),
        inputText: inputText || sourceUrl,
        status: 'pending',
      },
    });

    // 异步执行分析，完成后更新报告（不阻塞响应）
    void this.runAnalysis(report.id);

    return this.toReport(report);
  }

  private async runAnalysis(reportId: number) {
    try {
      const report = await this.prisma.analysisReport.findUnique({ where: { id: reportId } });
      if (!report) return;
      const result = await this.aiService.analyze({
        sourceUrl: report.sourceUrl || undefined,
        sourceType: report.sourceType,
        inputText: report.inputText,
      });
      await this.prisma.analysisReport.update({
        where: { id: reportId },
        data: { aiResult: result as any, riskLevel: result.riskLevel, status: 'done' },
      });
    } catch (e: any) {
      await this.prisma.analysisReport.update({
        where: { id: reportId },
        data: { status: 'failed', failReason: e.message || '分析失败' },
      });
    }
  }

  async getById(id: number, userId?: number): Promise<AnalysisReport> {
    const report = await this.prisma.analysisReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报告不存在');
    if (report.userId && report.userId !== userId) {
      throw new ForbiddenException('无权查看该报告');
    }
    return this.toReport(report);
  }

  /** 深度接洽流程：提交分步勾选结果，更新报告 */
  async deep(id: number, userId: number, feedback: any[]) {
    const report = await this.prisma.analysisReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报告不存在');
    if (report.userId !== userId) throw new ForbiddenException('无权操作该报告');
    if (!Array.isArray(feedback) || feedback.length === 0) {
      throw new BadRequestException('请先完成避坑清单');
    }
    const result = this.aiService.deepEvaluate(feedback);
    await this.prisma.analysisReport.update({
      where: { id },
      data: { deepFeedback: feedback as any, deepRiskLevel: result.deepRiskLevel },
    });
    return { ...this.toReport(report), deepFeedback: feedback, deepRiskLevel: result.deepRiskLevel, deepAlert: result.alert, deepSummary: result.summary };
  }

  toReport(r: any): AnalysisReport {
    const ai = (r.aiResult as any) || {};
    return {
      id: r.id,
      sourceUrl: r.sourceUrl || '',
      sourceType: r.sourceType,
      inputText: r.inputText,
      riskLevel: r.riskLevel || null,
      status: r.status,
      riskPoints: ai.riskPoints || [],
      dimensions: ai.dimensions || [],
      analysis: ai.analysis || '',
      recommendation: ai.recommendation || '',
      deepFeedback: r.deepFeedback || null,
      deepRiskLevel: r.deepRiskLevel || null,
      createdAt: r.createdAt.toISOString(),
      failReason: r.failReason || undefined,
    };
  }
}
