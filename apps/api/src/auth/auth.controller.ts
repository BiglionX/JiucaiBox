import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators';
import { LoginResponse } from '@jiucaibox/shared';
import { IsOptional, IsString } from 'class-validator';

class WechatLoginDto {
  @IsOptional()
  @IsString()
  openid?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nickname?: string;
}

class PhoneLoginDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  code?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wechat')
  wechat(@Body() dto: WechatLoginDto): Promise<LoginResponse> {
    return this.authService.wechatLogin(dto);
  }

  @Public()
  @Post('phone')
  phone(@Body() dto: PhoneLoginDto): Promise<LoginResponse> {
    return this.authService.phoneLogin(dto);
  }

  /** 无状态登出（前端清除 token 即可） */
  @Post('logout')
  logout() {
    return { ok: true };
  }
}
