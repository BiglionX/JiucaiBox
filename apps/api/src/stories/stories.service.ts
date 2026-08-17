import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LIMITS, PageResult, StoryItem } from '@jiucaibox/shared';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 公开故事列表（仅已审核），可筛选分类 */
  async list(
    query: { category?: string; page?: number; pageSize?: number },
    userId?: number,
  ): Promise<PageResult<StoryItem>> {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 10), 50);
    const where: any = { status: 'approved' };
    if (query.category && query.category !== 'all') where.category = query.category;

    const [total, stories, hugged] = await Promise.all([
      this.prisma.story.count({ where }),
      this.prisma.story.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { hugs: true, comments: true } } },
      }),
      userId
        ? this.prisma.storyHug.findMany({ where: { userId }, select: { storyId: true } })
        : Promise.resolve([]),
    ]);
    const huggedSet = new Set(hugged.map((h) => h.storyId));

    return {
      total,
      page,
      pageSize,
      list: stories.map((s) => this.toItem(s, huggedSet.has(s.id))),
    };
  }

  async detail(id: number, userId?: number): Promise<StoryItem> {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: { _count: { select: { hugs: true, comments: true } } },
    });
    if (!story) throw new NotFoundException('故事不存在');
    if (story.status !== 'approved' && story.userId !== userId) {
      throw new ForbiddenException('该故事未发布');
    }
    const hugged = userId
      ? !!(await this.prisma.storyHug.findUnique({
          where: { storyId_userId: { storyId: id, userId } },
        }))
      : false;
    return this.toItem(story, hugged);
  }

  /** 提交故事（默认匿名，待审核） */
  async create(
    userId: number,
    dto: {
      category: string;
      lossAmount?: number;
      lossTypes: string[];
      title: string;
      content: string;
      lesson?: string;
      images?: string[];
    },
  ): Promise<StoryItem> {
    const content = (dto.content || '').trim();
    const title = (dto.title || '').trim();
    if (content.length < LIMITS.storyContentMin) {
      throw new BadRequestException(`事情经过至少 ${LIMITS.storyContentMin} 字`);
    }
    if (content.length > LIMITS.storyContentMax) {
      throw new BadRequestException(`内容过长，请控制在 ${LIMITS.storyContentMax} 字以内`);
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const story = await this.prisma.story.create({
      data: {
        userId,
        userNickname: user.nickname,
        category: dto.category || 'other',
        lossAmount: dto.lossAmount ?? null,
        lossTypes: dto.lossTypes || [],
        title: title || content.slice(0, 20),
        content,
        lesson: dto.lesson || '',
        images: dto.images || [],
        status: 'pending',
      },
    });
    return this.toItem(story, false);
  }

  /** 抱抱（每人每故事一次） */
  async hug(storyId: number, userId: number) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('故事不存在');
    if (story.status !== 'approved') throw new BadRequestException('故事未发布，无法互动');
    await this.prisma.storyHug.upsert({
      where: { storyId_userId: { storyId, userId } },
      update: {},
      create: { storyId, userId },
    });
    const count = await this.prisma.storyHug.count({ where: { storyId } });
    return { hugged: true, hugCount: count };
  }

  async comments(storyId: number) {
    const comments = await this.prisma.storyComment.findMany({
      where: { storyId },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => ({
      id: c.id,
      storyId: c.storyId,
      userNickname: c.userNickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async addComment(storyId: number, userId: number, content: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('故事不存在');
    if (story.status !== 'approved') throw new BadRequestException('故事未发布，无法评论');
    const text = (content || '').trim();
    if (!text) throw new BadRequestException('评论不能为空');
    if (text.length > LIMITS.commentMax) throw new BadRequestException('评论过长');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const comment = await this.prisma.storyComment.create({
      data: { storyId, userId, userNickname: user!.nickname, content: text },
    });
    return {
      id: comment.id,
      storyId: comment.storyId,
      userNickname: comment.userNickname,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.storyComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('评论不存在');
    if (comment.userId !== userId) throw new ForbiddenException('只能删除自己的评论');
    await this.prisma.storyComment.delete({ where: { id: commentId } });
    return { ok: true };
  }

  private toItem(s: any, hugged: boolean): StoryItem {
    return {
      id: s.id,
      userNickname: s.userNickname,
      category: s.category,
      lossAmount: s.lossAmount,
      lossTypes: s.lossTypes || [],
      title: s.title,
      content: s.content,
      lesson: s.lesson || '',
      images: s.images || [],
      status: s.status,
      hugCount: s._count?.hugs ?? 0,
      commentCount: s._count?.comments ?? 0,
      createdAt: s.createdAt.toISOString(),
      hugged,
      rejectReason: s.rejectReason || undefined,
    };
  }
}
