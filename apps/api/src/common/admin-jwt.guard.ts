import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY, IS_PUBLIC_KEY, JwtAdmin } from './decorators';

/**
 * Admin 专用 JWT 守卫 + 角色校验。
 * 使用独立签名（payload 含 adminId），与用户 token 隔离。
 * 用法：@UseGuards(AdminJwtGuard) @Roles('super_admin', 'content_ops')
 */
@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 登录等公开接口放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) throw new UnauthorizedException('未登录或登录已过期');

    let payload: JwtAdmin;
    try {
      payload = await this.jwtService.verifyAsync<JwtAdmin>(token, {
        secret: process.env.JWT_SECRET + ':admin',
      });
    } catch {
      throw new UnauthorizedException('管理员登录已过期');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException('当前角色无权执行此操作');
      }
    }
    req.adminUser = payload;
    return true;
  }
}
