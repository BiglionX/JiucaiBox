import { Controller, Get, Header, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/decorators';
import { HomeData } from '@jiucaibox/shared';

@Controller('api')
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'jiucaibox-api', time: new Date().toISOString() };
  }

  /**
   * 首页聚合数据：预警横幅、推荐课程、最新故事、电台速报。
   * Hobby 计划函数默认 maxDuration = 10s，冷启动可能 7-9s。
   * 设置 s-maxage=60 让 Vercel CDN 缓存 60s：首次冷启动后，60s 内复用 CDN 响应，
   * 避免重复触发函数 + 数据库查询。
   */
  @Public()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60')
  @Get('home')
  async home(): Promise<HomeData> {
    const [featuredCourses, latestStories, latestRadio] = await Promise.all([
      this.prisma.course.findMany({
        take: 6,
        orderBy: { sort: 'asc' },
        include: { _count: { select: { videos: true } } },
      }),
      this.prisma.story.findMany({
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: 2,
        include: { _count: { select: { hugs: true, comments: true } } },
      }),
      this.prisma.radioEpisode.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      banner: {
        title: '最新曝光：传销头目出狱后变"国学大师"开办书院，已被关停',
        url: '/radio/1',
      },
      featuredCourses: featuredCourses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        coverUrl: c.coverUrl || '',
        category: c.category as any,
        isFree: c.isFree,
        learnerCount: c.learnerCount,
        createdAt: c.createdAt.toISOString(),
        videoCount: c._count.videos,
      })),
      latestStories: latestStories.map((s) => ({
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
        hugCount: s._count.hugs,
        commentCount: s._count.comments,
        createdAt: s.createdAt.toISOString(),
      })),
      latestRadio: latestRadio
        ? {
            id: latestRadio.id,
            title: latestRadio.title,
            sourceUrl: latestRadio.sourceUrl || '',
            sourceLabel: latestRadio.sourceLabel,
            coverUrl: latestRadio.coverUrl || undefined,
            summary: latestRadio.summary,
            tricks: (latestRadio.tricks as any) || [],
            warning: latestRadio.warning || '',
            relatedCourseId: latestRadio.relatedCourseId,
            createdAt: latestRadio.createdAt.toISOString(),
          }
        : null,
    };
  }
}
