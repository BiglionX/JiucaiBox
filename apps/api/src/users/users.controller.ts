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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, JwtUser } from '../common/decorators';
import { AppNotification, PageResult, UserProfile } from '@jiucaibox/shared';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bio?: string;
}

class MarkReadDto {
  @IsArray()
  ids: number[];
}

@Controller('api/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  profile(@CurrentUser() user: JwtUser): Promise<UserProfile> {
    return this.usersService.profile(user.userId);
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('learning')
  learning(@CurrentUser() user: JwtUser) {
    return this.usersService.learning(user.userId);
  }

  @Get('analysis')
  myAnalysis(
    @CurrentUser() user: JwtUser,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<PageResult<any>> {
    return this.usersService.myAnalysis(user.userId, Number(page), Number(pageSize));
  }

  @Get('stories')
  myStories(@CurrentUser() user: JwtUser) {
    return this.usersService.myStories(user.userId);
  }

  @Get('interactions')
  interactions(@CurrentUser() user: JwtUser) {
    return this.usersService.interactions(user.userId);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: JwtUser): Promise<AppNotification[]> {
    return this.usersService.notifications(user.userId);
  }

  @Get('certificates')
  myCertificates(@CurrentUser() user: JwtUser) {
    return this.usersService.myCertificates(user.userId);
  }

  @Get('certificates/:id')
  certificateDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.usersService.certificateDetail(user.userId, id);
  }

  @Post('notifications/read')
  markRead(@CurrentUser() user: JwtUser, @Body() dto: MarkReadDto) {
    return this.usersService.markRead(user.userId, dto.ids);
  }

  @Post('notifications/read-all')
  markAllRead(@CurrentUser() user: JwtUser) {
    return this.usersService.markAllRead(user.userId);
  }

  @Post('clear-learning')
  clearLearning(@CurrentUser() user: JwtUser) {
    return this.usersService.clearLearning(user.userId);
  }

  @Post('logout')
  logout() {
    return { ok: true };
  }

  @Delete('account')
  deleteAccount(@CurrentUser() user: JwtUser) {
    return this.usersService.deleteAccount(user.userId);
  }
}
