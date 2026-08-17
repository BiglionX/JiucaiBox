import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { COURSE_CATEGORY_LABELS, CourseDetail, CourseItem, PageResult, PopupItem, QuizQuestion } from '@jiucaibox/shared';

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
    let learnedMap = new Map<number, number>();
    if (userId) {
      const recs = await this.prisma.learningRecord.findMany({
        where: { userId },
        select: { courseId: true },
        distinct: ['courseId'],
      });
      recs.forEach((r) => learnedMap.set(r.courseId, 1));
      // 每门课已学视频数
      const learnedVideos = await this.prisma.learningRecord.groupBy({
        by: ['courseId'],
        where: { userId },
        _count: { _all: true },
      });
      learnedMap = new Map(learnedVideos.map((v) => [v.courseId, v._count._all]));
    }

    return {
      total,
      page,
      pageSize,
      list: courses.map((c) => {
        const totalVideos = c._count.videos;
        const learned = learnedMap.get(c.id) || 0;
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
          progress: totalVideos > 0 ? Math.round((learned / totalVideos) * 100) : 0,
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

  /** 标记视频已学（用户从外链返回后调用） */
  async markWatched(userId: number, videoId: number) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('视频不存在');
    await this.prisma.learningRecord.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { updatedAt: new Date() },
      create: { userId, videoId, courseId: video.courseId },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
    return { ok: true };
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
