import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginResponse, UserProfile } from '@jiucaibox/shared';
import { ANONYMOUS_NICKNAME_PREFIX, ANONYMOUS_SUFFIX_POOL } from '@jiucaibox/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** 微信授权登录（MVP：接收 openid 或 code，无企业资质时模拟） */
  async wechatLogin(body: { openid?: string; code?: string; nickname?: string }): Promise<LoginResponse> {
    const openid =
      body.openid ||
      (body.code ? `wx_${body.code}` : `wx_${Math.random().toString(36).slice(2, 14)}`);
    let user = await this.prisma.user.findUnique({ where: { openid } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid,
          nickname: body.nickname || this.randomNickname(),
          isAnonymous: true,
        },
      });
    }
    return this.buildLoginResponse(user);
  }

  /** 手机号验证码登录/注册（MVP：验证码不实际发送，任意 6 位数字可登录，生产接入短信服务） */
  async phoneLogin(body: { phone: string; code?: string }): Promise<LoginResponse> {
    const phone = (body.phone || '').trim();
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    const code = body.code || '';
    if (code && !/^\d{6}$/.test(code)) {
      throw new BadRequestException('验证码格式不正确');
    }
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, nickname: this.randomNickname(), isAnonymous: true },
      });
    }
    if (user.status === 'banned') {
      throw new BadRequestException('账号已被封禁，请联系客服');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    return this.buildLoginResponse(user);
  }

  private randomNickname(): string {
    const pool = ANONYMOUS_SUFFIX_POOL;
    let suffix = '';
    for (let i = 0; i < 3; i++) {
      suffix += pool[Math.floor(Math.random() * pool.length)];
    }
    return `${ANONYMOUS_NICKNAME_PREFIX}${suffix}`;
  }

  async buildLoginResponse(user: any): Promise<LoginResponse> {
    const token = await this.jwtService.signAsync({
      userId: user.id,
      phone: user.phone || undefined,
      nickname: user.nickname,
    });
    const profile: UserProfile = {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar || '',
      bio: user.bio || '',
      isAnonymous: user.isAnonymous,
      phone: user.phone || undefined,
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString(),
    };
    return { token, user: profile };
  }
}
