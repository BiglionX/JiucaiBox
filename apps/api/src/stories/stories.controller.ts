import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CurrentUser, JwtUser, Public } from '../common/decorators';
import { PageResult, StoryItem } from '@jiucaibox/shared';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

class CreateStoryDto {
  @IsString()
  category: string;

  @IsOptional()
  @IsNumber()
  lossAmount?: number;

  @IsOptional()
  @IsArray()
  lossTypes?: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsString()
  lesson?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}

@Controller('api/stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Public()
  @Get()
  list(
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @CurrentUser() user?: JwtUser,
  ): Promise<PageResult<StoryItem>> {
    return this.storiesService.list({ category, page, pageSize }, user?.userId);
  }

  @Public()
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: JwtUser) {
    return this.storiesService.detail(id, user?.userId);
  }

  @Post()
  create(@Body() dto: CreateStoryDto, @CurrentUser() user: JwtUser) {
    return this.storiesService.create(user.userId, dto);
  }

  @Post(':id/hug')
  hug(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.storiesService.hug(id, user.userId);
  }

  @Public()
  @Get(':id/comments')
  comments(@Param('id', ParseIntPipe) id: number) {
    return this.storiesService.comments(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.storiesService.addComment(id, user.userId, dto.content);
  }

  @Delete('comment/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.storiesService.deleteComment(id, user.userId);
  }
}
