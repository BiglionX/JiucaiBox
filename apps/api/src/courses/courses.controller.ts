import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CurrentUser, JwtUser, Public } from '../common/decorators';
import { CourseDetail, CourseItem, PageResult, PopupItem, QuizQuestion } from '@jiucaibox/shared';
import { IsInt, IsOptional, IsString } from 'class-validator';

class QuizAnswerDto {
  @IsInt()
  answer: number;
}

@Controller('api')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get('courses')
  list(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @CurrentUser() user?: JwtUser,
  ): Promise<PageResult<CourseItem>> {
    return this.coursesService.list({ category, search, page, pageSize }, user?.userId);
  }

  @Public()
  @Get('courses/:id')
  detail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtUser,
  ): Promise<CourseDetail> {
    return this.coursesService.detail(id, user?.userId);
  }

  @Post('videos/:id/watched')
  markWatched(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.coursesService.markWatched(user.userId, id);
  }

  @Public()
  @Get('popup/:videoId')
  popup(@Param('videoId', ParseIntPipe) videoId: number): Promise<PopupItem> {
    return this.coursesService.popup(videoId);
  }

  @Public()
  @Get('courses/:id/quiz')
  quiz(
    @Param('id', ParseIntPipe) id: number,
    @Query('chapter') chapter?: string,
  ): Promise<QuizQuestion[]> {
    return this.coursesService.quiz(id, chapter ? Number(chapter) : undefined);
  }

  @Post('quiz/:questionId/answer')
  submitQuiz(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: QuizAnswerDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.coursesService.submitQuiz(user.userId, questionId, dto.answer);
  }
}
