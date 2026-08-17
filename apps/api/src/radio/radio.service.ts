import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PageResult, RadioEpisode } from '@jiucaibox/shared';

@Injectable()
export class RadioService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { page?: number; pageSize?: number }): Promise<PageResult<RadioEpisode>> {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const [total, list] = await Promise.all([
      this.prisma.radioEpisode.count(),
      this.prisma.radioEpisode.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { relatedCourse: true },
      }),
    ]);
    return { total, page, pageSize, list: list.map((r) => this.toEpisode(r)) };
  }

  async detail(id: number): Promise<RadioEpisode> {
    const episode = await this.prisma.radioEpisode.findUnique({
      where: { id },
      include: { relatedCourse: true },
    });
    if (!episode) throw new NotFoundException('期数不存在');
    return this.toEpisode(episode);
  }

  private toEpisode(r: any): RadioEpisode {
    return {
      id: r.id,
      title: r.title,
      sourceUrl: r.sourceUrl || '',
      sourceLabel: r.sourceLabel,
      coverUrl: r.coverUrl || undefined,
      summary: r.summary,
      tricks: r.tricks || [],
      warning: r.warning || '',
      relatedCourseId: r.relatedCourseId,
      relatedCourseTitle: r.relatedCourse?.title,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
