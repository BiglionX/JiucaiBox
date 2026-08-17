import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { COURSE_CATEGORY_LABELS, CourseDetail, CourseItem, PageResult, PopupItem, QuizQuestion } from '@jiucaibox/shared';

/**
 * 视频完成判定：已观看时长 ≥ 视频时长 × 90%。
 * duration 为 0（未填写）时一律视为未完成，避免空时长视频被自动标记完成。
 */
export function isCompleted(duration: number, watchedSeconds: number): boolean {
  if (!duration || duration <= 0) return false;
  return watchedSeconds >= Math.floor(duration * 0.9);
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: { category?: string; search?: string; page?: number; pageSize?: number },
    userId?: number,
  ): Promise<PageResult<CourseItem>> {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const where: any = {};
    if (query.category && query.category !== 'all') where.category = query.category;
    if (query.search) {
      where.OR = [{ title: { contains: query.search } }, { description: { contains: query.search } }];
    }

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { videos: true } } },
      }),
    ]);

    // 学习进度（登录时）
    // 完成判定：watchedSeconds ≥ video.duration × 90%
    // 仅统计"有时长"的视频，避免无时长视频被误判为完成
    let completedMap = new Map<number, number>();
    if (userId) {
      const recs = await this.prisma.learningRecord.findMany({
        where: { userId },
        select: { courseId: true, videoId: true, watchedSeconds: true },
      });
      const videoIds = [...new Set(recs.map((r) => r.videoId))];
      const videos = await this.prisma.video.findMany({
        where: { id: { in: videoIds } },
        select: { id: true, duration: true },
      });
      const durMap = new Map(videos.map((v) => [v.id, v.duration]));
      for (const r of recs) {
        const dur = durMap.get(r.videoId) || 0;
        if (dur > 0 && r.watchedSeconds >= Math.floor(dur * 0.9)) {
          completedMap.set(r.courseId, (completedMap.get(r.courseId) || 0) + 1);
        }
      }
    }

    return {
      total,
      page,
      pageSize,
      list: courses.map((c) => {
        const totalVideos = c._count.videos;
        const learned = completedMap.get(c.id) || 0;
        return {
          id: c.id,
          title: c.title,
          description: c.description || '',
          coverUrl: c.coverUrl || '',
          category: c.category as any,
          isFree: c.isFree,
          learnerCount: c.learnerCount,
          createdAt: c.createdAt.toISOString(),
          videoCount: totalVideos,
          learnedCount: learned,
          // 完成进度 = 完成的视频数 / 课程总视频数
          progress: totalVideos > 0 ? Math.round((learned / totalVideos) * 100) : 0,
          difficulty: (c as any).difficulty ?? 'entry',
          targetAudience: (c as any).targetAudience ?? 'all',
          estimatedMinutes: (c as any).estimatedMinutes ?? 0,
          summary: (c as any).summary ?? '',
          outcomes: ((c as any).outcomes as string[]) || [],
          warningTips: ((c as any).warningTips as string[]) || [],
        };
      }),
    };
  }

  async detail(id: number, userId?: number): Promise<CourseDetail> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        videos: { orderBy: { order: 'asc' } },
        _count: { select: { videos: true } },
      },
    });
    if (!course) throw new NotFoundException('课程不存在');

    let watchedSet = new Set<number>();
    if (userId) {
      const recs = await this.prisma.learningRecord.findMany({
        where: { userId, courseId: id },
        select: { videoId: true },
      });
      watchedSet = new Set(recs.map((r) => r.videoId));
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description || '',
      coverUrl: course.coverUrl || '',
      category: course.category as any,
      isFree: course.isFree,
      learnerCount: course.learnerCount,
      createdAt: course.createdAt.toISOString(),
      videoCount: course._count.videos,
      difficulty: ((course as any).difficulty ?? 'entry') as any,
      targetAudience: ((course as any).targetAudience ?? 'all') as any,
      estimatedMinutes: (course as any).estimatedMinutes ?? 0,
      summary: (course as any).summary ?? '',
      outcomes: ((course as any).outcomes as string[]) || [],
      warningTips: ((course as any).warningTips as string[]) || [],
      videos: course.videos.map((v) => ({
        id: v.id,
        courseId: v.courseId,
        title: v.title,
        coverUrl: v.coverUrl || '',
        videoUrl: v.videoUrl,
        duration: v.duration,
        description: v.description || '',
        order: v.order,
        watched: watchedSet.has(v.id),
      })),
    };
  }

  /**
   * 标记视频已学（用户从外链返回后调用）。
   * watchedSeconds 可选：客户端能拿到 currentTime/duration 时（如内嵌播放器心跳）传入，
   * 后端按"已观看秒数 >= 视频时长 × 90%"判定是否完成；未传则记为"看过（未必完成）"。
   */
  async markWatched(userId: number, videoId: number, watchedSeconds?: number) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('视频不存在');

    // 现有记录的 watchedSeconds 取大值，避免回调顺序不同导致倒退
    const existing = await this.prisma.learningRecord.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    const incoming =
      typeof watchedSeconds === 'number' && Number.isFinite(watchedSeconds)
        ? Math.max(0, Math.floor(watchedSeconds))
        : 0;
    const nextSeconds = Math.max(existing?.watchedSeconds ?? 0, incoming);

    await this.prisma.learningRecord.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: {
        watchedSeconds: nextSeconds,
        updatedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        courseId: video.courseId,
        watchedSeconds: nextSeconds,
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
    const completed = isCompleted(video.duration, nextSeconds);

    // 课程完成检测：若该视频刚达成完成，且该用户已覆盖课程内全部"有时长"视频，
    // 则颁发学习证书（幂等：唯一约束 (userId, courseId) 防重发）
    if (completed) {
      await this.maybeIssueCertificate(userId, video.courseId);
    }

    return {
      ok: true,
      completed,
      watchedSeconds: nextSeconds,
    };
  }

  /** 用户完成课程（覆盖全部"有时长"视频）后颁发证书（仅首次，幂等） */
  private async maybeIssueCertificate(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { videos: { select: { id: true, duration: true } } },
    });
    if (!course) return;

    const timedVideos = course.videos.filter((v) => v.duration > 0);
    // 无"有时长"视频的课程不颁发（无法界定完成）
    if (timedVideos.length === 0) return;

    const recs = await this.prisma.learningRecord.findMany({
      where: { userId, courseId },
      select: { videoId: true, watchedSeconds: true },
    });
    const recMap = new Map(recs.map((r) => [r.videoId, r.watchedSeconds]));
    // 全部"有时长"视频都要达到完成阈值
    const allDone = timedVideos.every((v) => {
      const secs = recMap.get(v.id) ?? 0;
      return isCompleted(v.duration, secs);
    });
    if (!allDone) return;

    // 幂等：唯一约束兜底，先查避免无效写入
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const nickname = user?.nickname || '匿名用户';

    const cert = await this.prisma.certificate
      .create({
        data: {
          userId,
          courseId,
          userNicknameSnapshot: nickname,
          courseTitleSnapshot: course.title,
        },
      })
      .catch((e: any) => {
        // 并发下唯一约束冲突：忽略（视为已颁发）
        if (e?.code === 'P2002') return null;
        throw e;
      });
    if (!cert) return;

    // 同时写一条系统通知，携带证书编号
    await this.prisma.appNotification.create({
      data: {
        userId,
        type: 'cert_issued',
        title: `恭喜完成《${course.title}》`,
        content: `你已完成课程全部内容，学习证书（编号 #${cert.id}）已颁发，可在「我的证书」中查看。`,
      },
    });
  }

  async popup(videoId: number): Promise<PopupItem> {
    const popup = await this.prisma.popup.findUnique({ where: { videoId } });
    if (!popup) throw new NotFoundException('该视频暂无真相弹窗');
    return { id: popup.id, videoId: popup.videoId, content: popup.content };
  }

  async quiz(courseId: number, chapter?: number): Promise<QuizQuestion[]> {
    const questions = await this.prisma.quizQuestion.findMany({
      where: chapter ? { courseId, chapter } : { courseId },
      orderBy: [{ chapter: 'asc' }, { id: 'asc' }],
    });
    return questions.map((q) => ({
      id: q.id,
      courseId: q.courseId,
      chapter: q.chapter,
      question: q.question,
      options: (q.options as string[]) || [],
      correctOption: q.correctOption,
      explanation: q.explanation || '',
    }));
  }

  /** 提交校准测试答案 */
  async submitQuiz(userId: number, questionId: number, answer: number) {
    const q = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('题目不存在');
    if (answer < 0 || answer >= (q.options as string[]).length) {
      return { error: '选项无效' };
    }
    const correct = answer === q.correctOption;
    await this.prisma.userTestResult.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { answer, correct },
      create: { userId, questionId, answer, correct },
    });
    return {
      correct,
      correctOption: q.correctOption,
      explanation: q.explanation || '',
      options: q.options,
    };
  }
}
