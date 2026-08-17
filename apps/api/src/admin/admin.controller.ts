import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from '../common/admin-jwt.guard';
import { CurrentAdmin, JwtAdmin, Public, Roles } from '../common/decorators';
import { IsString } from 'class-validator';

const READ_ROLES = ['super_admin', 'content_ops', 'reviewer', 'support', 'analyst'];
const CONTENT_ROLES = ['super_admin', 'content_ops'];
const REVIEW_ROLES = ['super_admin', 'reviewer'];

class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---------- 登录 ----------
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  // ---------- 仪表盘 ----------
  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  // ---------- 课程管理 ----------
  @Roles(...READ_ROLES)
  @Get('courses')
  courses(@Query() query: any) {
    return this.adminService.courses(query);
  }

  @Roles(...READ_ROLES)
  @Get('courses/:id')
  courseDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.courseDetail(id);
  }

  @Roles(...CONTENT_ROLES)
  @Post('courses')
  createCourse(@Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.createCourse(dto).then((r) => {
      void this.adminService.log(admin, '创建课程', `course:${r.id}`, r.title, req.ip);
      return r;
    });
  }

  @Roles(...CONTENT_ROLES)
  @Put('courses/:id')
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.updateCourse(id, dto).then((r) => {
      void this.adminService.log(admin, '更新课程', `course:${id}`, r.title, req.ip);
      return r;
    });
  }

  @Roles(...CONTENT_ROLES)
  @Delete('courses/:id')
  deleteCourse(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.deleteCourse(id).then((r) => {
      void this.adminService.log(admin, '删除课程', `course:${id}`, '', req.ip);
      return r;
    });
  }

  // ---------- 视频管理 ----------
  @Roles(...CONTENT_ROLES)
  @Post('videos')
  createVideo(@Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.createVideo(dto).then((r) => {
      void this.adminService.log(admin, '添加视频', `video:${r.id}`, r.title, req.ip);
      return r;
    });
  }

  @Roles(...CONTENT_ROLES)
  @Put('videos/:id')
  updateVideo(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.updateVideo(id, dto).then((r) => {
      void this.adminService.log(admin, '更新视频', `video:${id}`, r.title, req.ip);
      return r;
    });
  }

  @Roles(...CONTENT_ROLES)
  @Delete('videos/:id')
  deleteVideo(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.deleteVideo(id).then((r) => {
      void this.adminService.log(admin, '删除视频', `video:${id}`, '', req.ip);
      return r;
    });
  }

  // ---------- 真相弹窗 ----------
  @Roles(...CONTENT_ROLES)
  @Post('popups')
  upsertPopup(@Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.upsertPopup(dto.videoId, dto.content).then((r) => {
      void this.adminService.log(admin, '配置真相弹窗', `popup:${r.id}`, `video:${dto.videoId}`, req.ip);
      return r;
    });
  }

  // ---------- 测试题 ----------
  @Roles(...CONTENT_ROLES)
  @Post('quiz')
  createQuiz(@Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.createQuiz(dto).then((r) => {
      void this.adminService.log(admin, '新增测试题', `quiz:${r.id}`, dto.question, req.ip);
      return r;
    });
  }

  @Roles(...CONTENT_ROLES)
  @Put('quiz/:id')
  updateQuiz(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.adminService.updateQuiz(id, dto);
  }

  @Roles(...CONTENT_ROLES)
  @Delete('quiz/:id')
  deleteQuiz(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteQuiz(id);
  }

  // ---------- 测评管理 ----------
  @Roles(...READ_ROLES)
  @Get('analysis')
  analysisList(@Query() query: any) {
    return this.adminService.analysisList(query);
  }

  @Roles(...READ_ROLES)
  @Get('analysis/:id')
  analysisDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.analysisDetail(id);
  }

  @Roles(...REVIEW_ROLES)
  @Put('analysis/:id/review')
  reviewAnalysis(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentAdmin() admin: JwtAdmin,
    @Req() req: any,
  ) {
    return this.adminService.reviewAnalysis(id, dto, admin.nickname).then((r) => {
      void this.adminService.log(admin, '复核测评', `analysis:${id}`, JSON.stringify(dto), req.ip);
      return r;
    });
  }

  @Roles(...REVIEW_ROLES)
  @Post('analysis/:id/rerun')
  rerunAnalysis(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.rerunAnalysis(id).then((r) => {
      void this.adminService.log(admin, '重跑测评', `analysis:${id}`, '', req.ip);
      return r;
    });
  }

  // ---------- 故事审核 ----------
  @Roles(...READ_ROLES)
  @Get('stories')
  storyList(@Query() query: any) {
    return this.adminService.storyList(query);
  }

  @Roles(...READ_ROLES)
  @Get('stories/:id')
  storyDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.storyDetail(id);
  }

  @Roles(...REVIEW_ROLES)
  @Post('stories/:id/approve')
  approveStory(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.approveStory(id).then((r) => {
      void this.adminService.log(admin, '审核通过故事', `story:${id}`, r.title, req.ip);
      return r;
    });
  }

  @Roles(...REVIEW_ROLES)
  @Post('stories/:id/reject')
  rejectStory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason?: string },
    @CurrentAdmin() admin: JwtAdmin,
    @Req() req: any,
  ) {
    return this.adminService.rejectStory(id, dto.reason || '').then((r) => {
      void this.adminService.log(admin, '驳回故事', `story:${id}`, dto.reason, req.ip);
      return r;
    });
  }

  @Roles(...REVIEW_ROLES)
  @Delete('stories/:id')
  deleteStory(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.deleteStory(id).then((r) => {
      void this.adminService.log(admin, '删除故事', `story:${id}`, '', req.ip);
      return r;
    });
  }

  // ---------- 评论管理 ----------
  @Roles(...READ_ROLES)
  @Get('comments')
  commentList(@Query() query: any) {
    return this.adminService.commentList(query);
  }

  @Roles(...REVIEW_ROLES)
  @Delete('comments/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.deleteComment(id).then((r) => {
      void this.adminService.log(admin, '删除评论', `comment:${id}`, '', req.ip);
      return r;
    });
  }

  // ---------- 电台管理 ----------
  @Roles(...READ_ROLES)
  @Get('radio')
  radioList(@Query() query: any) {
    return this.adminService.radioList(query);
  }

  @Roles(...CONTENT_ROLES)
  @Post('radio')
  createRadio(@Body() dto: any, @CurrentAdmin() admin: JwtAdmin, @Req() req: any) {
    return this.adminService.createRadio(dto).then((r) => {
      void this.adminService.log(admin, '新建电台', `radio:${r.id}`, r.title, req.ip);
      return r;
    });
  }

  @Roles(...CONTENT_ROLES)
  @Put('radio/:id')
  updateRadio(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.adminService.updateRadio(id, dto);
  }

  @Roles(...CONTENT_ROLES)
  @Delete('radio/:id')
  deleteRadio(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRadio(id);
  }

  // ---------- 用户管理 ----------
  @Roles('super_admin', 'support')
  @Get('users')
  userList(@Query() query: any) {
    return this.adminService.userList(query);
  }

  @Roles('super_admin', 'support')
  @Get('users/:id')
  userDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.userDetail(id);
  }

  @Roles('super_admin')
  @Put('users/:id/ban')
  setUserBan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { banned: boolean },
    @CurrentAdmin() admin: JwtAdmin,
    @Req() req: any,
  ) {
    return this.adminService.setUserBan(id, dto.banned).then((r) => {
      void this.adminService.log(admin, dto.banned ? '封禁用户' : '解封用户', `user:${id}`, '', req.ip);
      return r;
    });
  }

  // ---------- 风险词库 ----------
  @Roles(...CONTENT_ROLES)
  @Get('lexicon')
  lexiconWords() {
    return this.adminService.lexiconWords();
  }

  @Roles(...CONTENT_ROLES)
  @Post('lexicon')
  createWord(@Body() dto: any) {
    return this.adminService.createWord(dto);
  }

  @Roles(...CONTENT_ROLES)
  @Put('lexicon/:id')
  updateWord(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.adminService.updateWord(id, dto);
  }

  @Roles(...CONTENT_ROLES)
  @Delete('lexicon/:id')
  deleteWord(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteWord(id);
  }

  // ---------- 数据统计 ----------
  @Roles('super_admin', 'analyst', 'content_ops')
  @Get('stats/overview')
  statsOverview() {
    return this.adminService.statsOverview();
  }

  // ---------- 操作日志 ----------
  @Roles('super_admin')
  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.adminService.logs(limit ? Number(limit) : 100);
  }
}
