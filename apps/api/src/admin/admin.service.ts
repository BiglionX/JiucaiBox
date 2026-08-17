import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { VIDEO_URL_WHITELIST } from '@jiucaibox/shared';
import { AdminUser, DashboardData, StatsOverview } from '@jiucaibox/shared';

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  content_ops: '内容运营',
  reviewer: '审核专员',
  support: '客服/运营支持',
  analyst: '数据分析',
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ---------- 登录 ----------
  async login(username: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username } });
    if (!admin) throw new UnauthorizedException('账号或密码错误');
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) throw new UnauthorizedException('账号或密码错误');
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    const token = await this.jwtService.signAsync(
      { adminId: admin.id, username: admin.username, role: admin.role, nickname: admin.nickname },
      { secret: process.env.JWT_SECRET + ':admin', expiresIn: '12h' },
    );
    return { token, admin: this.toAdmin(admin) };
  }

  // ---------- 仪表盘 ----------
  async dashboard(): Promise<DashboardData> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const [newUsers, analysisCount, pendingStories, completedVideos, riskReports, pendingReviews, recentStories] =
      await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.analysisReport.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.story.count({ where: { status: 'pending' } }),
        this.prisma.learningRecord.count({ where: { updatedAt: { gte: todayStart } } }),
        this.prisma.analysisReport.findMany({
          where: { createdAt: { gte: weekAgo }, riskLevel: { not: null } },
          select: { riskLevel: true },
        }),
        this.prisma.analysisReport.count({ where: { status: 'done', reviewed: false } }),
        this.prisma.story.findMany({
          where: { status: 'pending' },
          orderBy: { createdAt: 'asc' },
          take: 5,
        }),
      ]);

    const riskDistribution = [
      { level: 'high' as const, count: riskReports.filter((r) => r.riskLevel === 'high').length },
      { level: 'medium' as const, count: riskReports.filter((r) => r.riskLevel === 'medium').length },
      { level: 'low' as const, count: riskReports.filter((r) => r.riskLevel === 'low').length },
    ];

    return {
      today: { newUsers, analysisCount, pendingStories, completedVideos },
      riskDistribution,
      pendingReviews,
      recentStories: recentStories.map((s) => ({
        id: s.id,
        userNickname: s.userNickname,
        category: s.category as any,
        lossAmount: s.lossAmount,
        lossTypes: (s.lossTypes as any) || [],
        title: s.title,
        content: s.content,
        lesson: s.lesson || '',
        images: (s.images as any) || [],
        status: s.status as any,
        hugCount: 0,
        commentCount: 0,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  // ---------- 课程管理 ----------
  async courses(query: { page?: number; pageSize?: number; category?: string; search?: string }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const where: any = {};
    if (query.category && query.category !== 'all') where.category = query.category;
    if (query.search) where.title = { contains: query.search };
    const [total, list] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { videos: true, quizQuestions: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      list: list.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        coverUrl: c.coverUrl || '',
        category: c.category,
        isFree: c.isFree,
        learnerCount: c.learnerCount,
        sort: c.sort,
        createdAt: c.createdAt.toISOString(),
        videoCount: c._count.videos,
        quizCount: c._count.quizQuestions,
      })),
    };
  }

  async createCourse(dto: any) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        coverUrl: dto.coverUrl || '',
        category: dto.category || 'truth',
        isFree: true,
        learnerCount: dto.learnerCount || 0,
        sort: dto.sort || 0,
      },
    });
    return course;
  }

  async updateCourse(id: number, dto: any) {
    await this.ensureCourse(id);
    return this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.learnerCount !== undefined ? { learnerCount: dto.learnerCount } : {}),
        ...(dto.sort !== undefined ? { sort: dto.sort } : {}),
      },
    });
  }

  async deleteCourse(id: number) {
    await this.ensureCourse(id);
    await this.prisma.course.delete({ where: { id } });
    return { ok: true };
  }

  async courseDetail(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        videos: { orderBy: { order: 'asc' }, include: { popup: true } },
        quizQuestions: { orderBy: [{ chapter: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!course) throw new NotFoundException('课程不存在');
    return {
      id: course.id,
      title: course.title,
      description: course.description || '',
      coverUrl: course.coverUrl || '',
      category: course.category,
      learnerCount: course.learnerCount,
      sort: course.sort,
      createdAt: course.createdAt.toISOString(),
      videos: course.videos.map((v) => ({
        id: v.id,
        courseId: v.courseId,
        title: v.title,
        coverUrl: v.coverUrl || '',
        videoUrl: v.videoUrl,
        duration: v.duration,
        description: v.description || '',
        order: v.order,
        popup: v.popup ? { id: v.popup.id, content: v.popup.content } : null,
      })),
      quizQuestions: course.quizQuestions.map((q) => ({
        id: q.id,
        courseId: q.courseId,
        chapter: q.chapter,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation || '',
      })),
    };
  }

  // ---------- 视频管理 ----------
  async createVideo(dto: any) {
    await this.ensureCourse(dto.courseId);
    this.validateVideoUrl(dto.videoUrl);
    return this.prisma.video.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        coverUrl: dto.coverUrl || '',
        videoUrl: dto.videoUrl,
        duration: dto.duration || 0,
        description: dto.description || '',
        order: dto.order ?? 0,
      },
    });
  }

  async updateVideo(id: number, dto: any) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('视频不存在');
    if (dto.videoUrl !== undefined) this.validateVideoUrl(dto.videoUrl);
    return this.prisma.video.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl } : {}),
        ...(dto.videoUrl !== undefined ? { videoUrl: dto.videoUrl } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async deleteVideo(id: number) {
    await this.prisma.video.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 真相弹窗 ----------
  async upsertPopup(videoId: number, content: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('视频不存在');
    return this.prisma.popup.upsert({
      where: { videoId },
      update: { content },
      create: { videoId, content },
    });
  }

  // ---------- 测试题 ----------
  async createQuiz(dto: any) {
    await this.ensureCourse(dto.courseId);
    if (!Array.isArray(dto.options) || dto.options.length < 2) {
      throw new BadRequestException('选项至少 2 个');
    }
    if (dto.correctOption < 0 || dto.correctOption >= dto.options.length) {
      throw new BadRequestException('正确答案索引无效');
    }
    return this.prisma.quizQuestion.create({
      data: {
        courseId: dto.courseId,
        chapter: dto.chapter || 1,
        question: dto.question,
        options: dto.options,
        correctOption: dto.correctOption,
        explanation: dto.explanation || '',
      },
    });
  }

  async updateQuiz(id: number, dto: any) {
    await this.prisma.quizQuestion.findUniqueOrThrow({ where: { id } });
    return this.prisma.quizQuestion.update({
      where: { id },
      data: {
        ...(dto.chapter !== undefined ? { chapter: dto.chapter } : {}),
        ...(dto.question !== undefined ? { question: dto.question } : {}),
        ...(dto.options !== undefined ? { options: dto.options } : {}),
        ...(dto.correctOption !== undefined ? { correctOption: dto.correctOption } : {}),
        ...(dto.explanation !== undefined ? { explanation: dto.explanation } : {}),
      },
    });
  }

  async deleteQuiz(id: number) {
    await this.prisma.quizQuestion.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 测评管理 ----------
  async analysisList(query: { status?: string; riskLevel?: string; reviewed?: string; page?: number; pageSize?: number }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const where: any = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.riskLevel && query.riskLevel !== 'all') where.riskLevel = query.riskLevel;
    if (query.reviewed && query.reviewed !== 'all') where.reviewed = query.reviewed === '1' || query.reviewed === 'true';
    const [total, list] = await Promise.all([
      this.prisma.analysisReport.count({ where }),
      this.prisma.analysisReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, nickname: true, phone: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      list: list.map((r) => ({
        id: r.id,
        userId: r.userId,
        userNickname: r.user?.nickname || '游客',
        sourceUrl: r.sourceUrl || '',
        sourceType: r.sourceType,
        inputText: r.inputText,
        riskLevel: r.riskLevel,
        status: r.status,
        reviewed: r.reviewed,
        reviewerNote: r.reviewerNote || '',
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async analysisDetail(id: number) {
    const r = await this.prisma.analysisReport.findUnique({
      where: { id },
      include: { user: { select: { id: true, nickname: true, phone: true } } },
    });
    if (!r) throw new NotFoundException('报告不存在');
    return {
      id: r.id,
      userId: r.userId,
      userNickname: r.user?.nickname || '游客',
      sourceUrl: r.sourceUrl || '',
      sourceType: r.sourceType,
      inputText: r.inputText,
      riskLevel: r.riskLevel,
      status: r.status,
      failReason: r.failReason || undefined,
      aiResult: r.aiResult,
      deepFeedback: r.deepFeedback,
      deepRiskLevel: r.deepRiskLevel,
      reviewed: r.reviewed,
      reviewerNote: r.reviewerNote || '',
      reviewedBy: r.reviewedBy || '',
      createdAt: r.createdAt.toISOString(),
    };
  }

  async reviewAnalysis(id: number, dto: { riskLevel?: string; note?: string }, reviewer: string) {
    const r = await this.prisma.analysisReport.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('报告不存在');
    return this.prisma.analysisReport.update({
      where: { id },
      data: {
        reviewed: true,
        reviewedBy: reviewer,
        ...(dto.riskLevel ? { riskLevel: dto.riskLevel } : {}),
        ...(dto.note !== undefined ? { reviewerNote: dto.note } : {}),
      },
    });
  }

  async rerunAnalysis(id: number) {
    const r = await this.prisma.analysisReport.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('报告不存在');
    // 重新触发分析（由 analysis 模块负责，此处仅置为 pending 由前端重新提交简化处理）
    return { ok: true, message: '请在前端重新提交测评以触发新分析' };
  }

  // ---------- 故事审核 ----------
  async storyList(query: { status?: string; page?: number; pageSize?: number }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const where: any = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    const [total, list] = await Promise.all([
      this.prisma.story.count({ where }),
      this.prisma.story.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], // pending 置顶
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { hugs: true, comments: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      list: list.map((s) => ({
        id: s.id,
        userId: s.userId,
        userNickname: s.userNickname,
        category: s.category,
        lossAmount: s.lossAmount,
        lossTypes: s.lossTypes,
        title: s.title,
        content: s.content,
        lesson: s.lesson || '',
        images: s.images,
        status: s.status,
        rejectReason: s.rejectReason || '',
        hugCount: s._count.hugs,
        commentCount: s._count.comments,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  async storyDetail(id: number) {
    const s = await this.prisma.story.findUnique({
      where: { id },
      include: {
        _count: { select: { hugs: true, comments: true } },
        comments: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });
    if (!s) throw new NotFoundException('故事不存在');
    return {
      id: s.id,
      userId: s.userId,
      userNickname: s.userNickname,
      category: s.category,
      lossAmount: s.lossAmount,
      lossTypes: s.lossTypes,
      title: s.title,
      content: s.content,
      lesson: s.lesson || '',
      images: s.images,
      status: s.status,
      rejectReason: s.rejectReason || '',
      hugCount: s._count.hugs,
      commentCount: s._count.comments,
      createdAt: s.createdAt.toISOString(),
      comments: s.comments,
    };
  }

  async approveStory(id: number) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('故事不存在');
    const updated = await this.prisma.story.update({
      where: { id },
      data: { status: 'approved', rejectReason: null },
    });
    // 审核结果通知
    await this.prisma.appNotification.create({
      data: {
        userId: story.userId,
        type: 'review',
        title: '故事审核通过',
        content: `你的分享《${story.title}》已通过审核并发布，感谢你的经历帮助了更多人。`,
      },
    });
    return updated;
  }

  async rejectStory(id: number, reason: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('故事不存在');
    const updated = await this.prisma.story.update({
      where: { id },
      data: { status: 'rejected', rejectReason: reason || '内容不符合社区规范' },
    });
    await this.prisma.appNotification.create({
      data: {
        userId: story.userId,
        type: 'review',
        title: '故事未通过审核',
        content: `你的分享《${story.title}》未通过审核：${reason || '内容不符合社区规范'}。可修改后重新提交。`,
      },
    });
    return updated;
  }

  async deleteStory(id: number) {
    await this.prisma.story.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 评论管理 ----------
  async commentList(query: { storyId?: number; page?: number; pageSize?: number }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 20), 100);
    const where: any = {};
    if (query.storyId) where.storyId = query.storyId;
    const [total, list] = await Promise.all([
      this.prisma.storyComment.count({ where }),
      this.prisma.storyComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { story: { select: { id: true, title: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      list: list.map((c) => ({
        id: c.id,
        storyId: c.storyId,
        storyTitle: c.story.title,
        userNickname: c.userNickname,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  async deleteComment(id: number) {
    await this.prisma.storyComment.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 电台管理 ----------
  async radioList(query: { page?: number; pageSize?: number }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const [total, list] = await Promise.all([
      this.prisma.radioEpisode.count(),
      this.prisma.radioEpisode.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      list: list.map((r) => ({
        id: r.id,
        title: r.title,
        sourceUrl: r.sourceUrl || '',
        sourceLabel: r.sourceLabel,
        coverUrl: r.coverUrl || '',
        summary: r.summary,
        tricks: r.tricks,
        warning: r.warning || '',
        relatedCourseId: r.relatedCourseId,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createRadio(dto: any) {
    return this.prisma.radioEpisode.create({
      data: {
        title: dto.title,
        sourceUrl: dto.sourceUrl || '',
        sourceLabel: dto.sourceLabel || '官方通报',
        coverUrl: dto.coverUrl || '',
        summary: dto.summary || '',
        tricks: dto.tricks || [],
        warning: dto.warning || '',
        relatedCourseId: dto.relatedCourseId || null,
      },
    });
  }

  async updateRadio(id: number, dto: any) {
    await this.prisma.radioEpisode.findUniqueOrThrow({ where: { id } });
    return this.prisma.radioEpisode.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.sourceUrl !== undefined ? { sourceUrl: dto.sourceUrl } : {}),
        ...(dto.sourceLabel !== undefined ? { sourceLabel: dto.sourceLabel } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.tricks !== undefined ? { tricks: dto.tricks } : {}),
        ...(dto.warning !== undefined ? { warning: dto.warning } : {}),
        ...(dto.relatedCourseId !== undefined ? { relatedCourseId: dto.relatedCourseId } : {}),
      },
    });
  }

  async deleteRadio(id: number) {
    await this.prisma.radioEpisode.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 用户管理 ----------
  async userList(query: { search?: string; status?: string; page?: number; pageSize?: number }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const where: any = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.search) {
      where.OR = [
        { nickname: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }
    const [total, list] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    // 关联统计
    const ids = list.map((u) => u.id);
    const [analysisCounts, storyCounts, courseCounts] = await Promise.all([
      this.prisma.analysisReport.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
      this.prisma.story.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
      this.prisma.learningRecord.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
    ]);
    const countMap = (rows: { userId: number | null; _count: { _all: number } }[]) =>
      new Map(rows.map((r) => [r.userId ?? -1, r._count._all]));

    const aMap = countMap(analysisCounts);
    const sMap = countMap(storyCounts);
    const cMap = countMap(courseCounts);

    return {
      total,
      page,
      pageSize,
      list: list.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar || '',
        phone: u.phone || undefined,
        isAnonymous: u.isAnonymous,
        createdAt: u.createdAt.toISOString(),
        lastActiveAt: u.lastActiveAt?.toISOString(),
        status: u.status,
        courseCount: cMap.get(u.id) || 0,
        analysisCount: aMap.get(u.id) || 0,
        storyCount: sMap.get(u.id) || 0,
      })),
    };
  }

  async userDetail(id: number) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('用户不存在');
    const [learning, analysis, stories] = await Promise.all([
      this.prisma.learningRecord.findMany({
        where: { userId: id },
        include: { video: { select: { id: true, title: true, courseId: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      this.prisma.analysisReport.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.story.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    return {
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar || '',
      bio: u.bio || '',
      phone: u.phone || undefined,
      isAnonymous: u.isAnonymous,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: u.lastActiveAt?.toISOString(),
      learning: learning.map((l) => ({
        videoId: l.videoId,
        videoTitle: l.video.title,
        courseId: l.video.courseId,
        updatedAt: l.updatedAt.toISOString(),
      })),
      analysis: analysis.map((a) => ({
        id: a.id,
        sourceUrl: a.sourceUrl || '',
        riskLevel: a.riskLevel,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
      stories: stories.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  async setUserBan(id: number, banned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    await this.prisma.user.update({
      where: { id },
      data: { status: banned ? 'banned' : 'active' },
    });
    return { ok: true, status: banned ? 'banned' : 'active' };
  }

  // ---------- 风险词库 ----------
  async lexiconWords() {
    return this.prisma.riskWord.findMany({ orderBy: [{ category: 'asc' }, { id: 'asc' }] });
  }

  async createWord(dto: { word: string; category: string; weight?: number }) {
    if (!dto.word || !dto.category) throw new BadRequestException('词条与分类不能为空');
    return this.prisma.riskWord.upsert({
      where: { word_category: { word: dto.word, category: dto.category } },
      update: { weight: dto.weight || 1, active: true },
      create: { word: dto.word, category: dto.category, weight: dto.weight || 1 },
    });
  }

  async updateWord(id: number, dto: { weight?: number; active?: boolean; category?: string }) {
    await this.prisma.riskWord.findUniqueOrThrow({ where: { id } });
    return this.prisma.riskWord.update({
      where: { id },
      data: {
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
      },
    });
  }

  async deleteWord(id: number) {
    await this.prisma.riskWord.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 数据统计 ----------
  async statsOverview(): Promise<StatsOverview> {
    const now = new Date();
    const days: string[] = [];
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (let i = 6; i >= 0; i--) days.push(fmt(new Date(now.getTime() - i * 86400000)));

    const groupByDay = (rows: { createdAt: Date }[]) => {
      const map = new Map<string, number>();
      days.forEach((d) => map.set(d, 0));
      for (const r of rows) {
        const d = fmt(r.createdAt);
        if (map.has(d)) map.set(d, map.get(d)! + 1);
      }
      return [...map.entries()].map(([date, count]) => ({ date, count }));
    };

    const [users, analysis, stories, riskReports, doneReports, courses, learningRecs] = await Promise.all([
      this.prisma.user.findMany({ where: { createdAt: { gte: new Date(now.getTime() - 6 * 86400000) } }, select: { createdAt: true } }),
      this.prisma.analysisReport.findMany({ where: { createdAt: { gte: new Date(now.getTime() - 6 * 86400000) } }, select: { createdAt: true, riskLevel: true, aiResult: true } }),
      this.prisma.story.findMany({ where: { createdAt: { gte: new Date(now.getTime() - 6 * 86400000) } }, select: { createdAt: true } }),
      this.prisma.analysisReport.findMany({ where: { createdAt: { gte: new Date(now.getTime() - 6 * 86400000) }, riskLevel: { not: null } }, select: { riskLevel: true } }),
      this.prisma.analysisReport.findMany({ where: { status: 'done', createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } }, select: { aiResult: true } }),
      this.prisma.course.findMany({ include: { _count: { select: { videos: true } } } }),
      this.prisma.learningRecord.groupBy({ by: ['courseId'], _count: { _all: true } }),
    ]);

    const riskRatio = [
      { level: 'high' as const, count: riskReports.filter((r) => r.riskLevel === 'high').length },
      { level: 'medium' as const, count: riskReports.filter((r) => r.riskLevel === 'medium').length },
      { level: 'low' as const, count: riskReports.filter((r) => r.riskLevel === 'low').length },
    ];

    const typeCount = new Map<string, number>();
    for (const r of doneReports) {
      const ai: any = r.aiResult;
      const points: any[] = ai?.riskPoints || [];
      for (const p of points) {
        typeCount.set(p.type, (typeCount.get(p.type) || 0) + p.count);
      }
    }
    const topRiskTypes = [...typeCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const recMap = new Map(learningRecs.map((r) => [r.courseId, r._count._all]));

    return {
      userGrowth: groupByDay(users),
      analysisTrend: groupByDay(analysis),
      storyTrend: groupByDay(stories),
      riskRatio,
      topRiskTypes,
      courseCompletion: courses.map((c) => ({
        title: c.title,
        completionRate:
          c._count.videos > 0
            ? Math.min(100, Math.round(((recMap.get(c.id) || 0) / c._count.videos) * 100))
            : 0,
      })),
    };
  }

  // ---------- 操作日志 ----------
  async logs(limit = 100) {
    return this.prisma.operationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }

  async log(admin: any, action: string, target?: string, detail?: string, ip?: string) {
    await this.prisma.operationLog.create({
      data: {
        adminId: admin?.adminId || null,
        adminName: admin?.nickname || admin?.username || 'unknown',
        action,
        target,
        detail: detail ? String(detail).slice(0, 500) : undefined,
        ip,
      },
    });
  }

  // ---------- 工具 ----------
  private validateVideoUrl(url: string) {
    try {
      const host = new URL(url).hostname;
      const ok = VIDEO_URL_WHITELIST.some((d) => host === d || host.endsWith('.' + d));
      if (!ok) {
        throw new BadRequestException(`视频链接域名不在白名单内（${host}），仅允许: ${VIDEO_URL_WHITELIST.join(', ')}`);
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('视频链接格式无效');
    }
  }

  private async ensureCourse(id: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('课程不存在');
    return course;
  }

  private toAdmin(a: any): AdminUser {
    return {
      id: a.id,
      username: a.username,
      role: a.role,
      nickname: a.nickname,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
