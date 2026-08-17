import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppNotification,
  LearningRecord,
  LearningStats,
  PageResult,
  UserProfile,
} from '@jiucaibox/shared';
import { LIMITS } from '@jiucaibox/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: number): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    const [courseCount, analysisCount, storyCount] = await Promise.all([
      this.prisma.learningRecord.findMany({
        where: { userId },
        distinct: ['courseId'],
        select: { courseId: true },
      }),
      this.prisma.analysisReport.count({ where: { userId } }),
      this.prisma.story.count({ where: { userId } }),
    ]);
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar || '',
      bio: user.bio || '',
      isAnonymous: user.isAnonymous,
      phone: user.phone || undefined,
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString(),
      stats: {
        courseCount: courseCount.length,
        analysisCount,
        storyCount,
      },
    };
  }

  async updateProfile(
    userId: number,
    dto: { nickname?: string; avatar?: string; bio?: string },
  ) {
    if (dto.nickname !== undefined) {
      const nickname = dto.nickname.trim();
      if (nickname.length < LIMITS.nicknameMin || nickname.length > LIMITS.nicknameMax) {
        throw new BadRequestException(`昵称需在 ${LIMITS.nicknameMin}-${LIMITS.nicknameMax} 个字符之间`);
      }
    }
    if (dto.bio !== undefined && dto.bio.length > LIMITS.bioMax) {
      throw new BadRequestException(`简介不能超过 ${LIMITS.bioMax} 字`);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined ? { nickname: dto.nickname.trim() } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      },
    });
    return this.profile(userId);
  }

  /** 学习记录：统计 + 最近学习 + 我的课程 */
  async learning(userId: number) {
    const records = await this.prisma.learningRecord.findMany({
      where: { userId },
      include: { video: { include: { course: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const byCourse = new Map<
      number,
      { courseId: number; courseTitle: string; coverUrl: string; learned: Set<number>; total: number; lastVideoId: number | null; updatedAt: Date }
    >();
    for (const r of records) {
      const cid = r.courseId;
      if (!byCourse.has(cid)) {
        byCourse.set(cid, {
          courseId: cid,
          courseTitle: r.video.course.title,
          coverUrl: r.video.course.coverUrl || '',
          learned: new Set(),
          total: 0,
          lastVideoId: null,
          updatedAt: r.updatedAt,
        });
      }
      const entry = byCourse.get(cid)!;
      entry.learned.add(r.videoId);
      entry.lastVideoId = r.videoId;
      if (r.updatedAt > entry.updatedAt) entry.updatedAt = r.updatedAt;
    }

    const courses = await this.prisma.course.findMany({
      where: { id: { in: [...byCourse.keys()] } },
      include: { _count: { select: { videos: true } } },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    const list: LearningRecord[] = [...byCourse.values()].map((e) => {
      const total = courseMap.get(e.courseId)?._count.videos || 0;
      return {
        courseId: e.courseId,
        courseTitle: e.courseTitle,
        coverUrl: e.coverUrl,
        learnedCount: e.learned.size,
        totalCount: total,
        progress: total > 0 ? Math.round((e.learned.size / total) * 100) : 0,
        lastVideoId: e.lastVideoId,
        updatedAt: e.updatedAt.toISOString(),
      };
    });

    const stats: LearningStats = {
      courseCount: list.length,
      videoCount: records.length,
      totalSeconds: records.reduce((n, r) => n + r.watchedSeconds, 0),
    };
    return { stats, records: list };
  }

  async myAnalysis(userId: number, page = 1, pageSize = 10): Promise<PageResult<any>> {
    const [total, list] = await Promise.all([
      this.prisma.analysisReport.count({ where: { userId } }),
      this.prisma.analysisReport.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      list: list.map((r) => this.toReport(r)),
    };
  }

  async myStories(userId: number): Promise<any[]> {
    const stories = await this.prisma.story.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { hugs: true, comments: true } } },
    });
    return stories.map((s) => ({
      id: s.id,
      userNickname: s.userNickname,
      category: s.category,
      lossAmount: s.lossAmount,
      lossTypes: s.lossTypes,
      title: s.title,
      content: s.content,
      lesson: s.lesson || '',
      images: s.images,
      status: s.status,
      rejectReason: s.rejectReason || undefined,
      hugCount: s._count.hugs,
      commentCount: s._count.comments,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async interactions(userId: number) {
    const [comments, hugs] = await Promise.all([
      this.prisma.storyComment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { story: { select: { id: true, title: true } } },
      }),
      this.prisma.storyHug.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { story: { select: { id: true, title: true } } },
      }),
    ]);
    return {
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        storyId: c.storyId,
        storyTitle: c.story.title,
        createdAt: c.createdAt.toISOString(),
      })),
      hugs: hugs.map((h) => ({
        id: h.id,
        storyId: h.storyId,
        storyTitle: h.story.title,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async notifications(userId: number): Promise<AppNotification[]> {
    const list = await this.prisma.appNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return list.map((n) => ({
      id: n.id,
      type: n.type as any,
      title: n.title,
      content: n.content,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  /** 我的学习证书列表（最新在前） */
  async myCertificates(userId: number) {
    const list = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
    return list.map((c) => this.toCertificate(c));
  }

  /** 证书详情（校验归属） */
  async certificateDetail(userId: number, certId: number) {
    const cert = await this.prisma.certificate.findUnique({ where: { id: certId } });
    if (!cert || cert.userId !== userId) throw new NotFoundException('证书不存在');
    return this.toCertificate(cert);
  }

  private toCertificate(c: any) {
    return {
      certId: c.id,
      courseId: c.courseId,
      courseTitle: c.courseTitleSnapshot,
      userId: c.userId,
      userNickname: c.userNicknameSnapshot,
      issuedAt: c.issuedAt.toISOString(),
      pdfUrl: c.pdfUrl ?? null,
    };
  }

  async markRead(userId: number, ids: number[]) {
    await this.prisma.appNotification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: number) {
    await this.prisma.appNotification.updateMany({ where: { userId }, data: { read: true } });
    return { ok: true };
  }

  async clearLearning(userId: number) {
    await this.prisma.learningRecord.deleteMany({ where: { userId } });
    return { ok: true };
  }

  async deleteAccount(userId: number) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }

  toReport(r: any) {
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
