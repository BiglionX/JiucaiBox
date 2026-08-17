import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CurrentUser, JwtUser, Public } from '../common/decorators';
import { AnalysisReport } from '@jiucaibox/shared';
import { IsArray, IsOptional, IsString } from 'class-validator';

class CreateAnalysisDto {
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceType?: 'video' | 'article' | 'other';

  @IsOptional()
  @IsString()
  inputText?: string;
}

class DeepDto {
  @IsArray()
  feedback: { step: number; question: string; answer: 'yes' | 'no' | 'unsure' }[];
}

@Controller('api/analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  create(@Body() dto: CreateAnalysisDto, @CurrentUser() user?: JwtUser): Promise<AnalysisReport> {
    return this.analysisService.create(user?.userId, dto);
  }

  @Get(':id')
  getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtUser,
  ): Promise<AnalysisReport> {
    return this.analysisService.getById(id, user?.userId);
  }

  @Post(':id/deep')
  deep(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeepDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.analysisService.deep(id, user.userId, dto.feedback);
  }
}
