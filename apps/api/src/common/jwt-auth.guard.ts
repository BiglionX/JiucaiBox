import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY, JwtUser } from './decorators';

/**
 * 全局 JWT 守卫：
 * - @Public() 接口放行；
 * - 其余接口校验 Authorization: Bearer <token>，解析出 req.user。
 * - Admin 接口使用独立 token（payload 含 adminId），由 AdminJwtGuard 校验。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 管理后台路由由 AdminJwtGuard 独立鉴权（token 体系不同），此处直接放行
    if (req.path?.startsWith('/admin')) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const token = this.extractToken(req);
    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('请先登录');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUser>(token);
      req.user = payload;
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }

  private extractToken(req: any): string | null {
    const auth = req.headers?.authorization || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
  }
}
