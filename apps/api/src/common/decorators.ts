import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** 标记接口为公开（无需登录） */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface JwtUser {
  userId: number;
  phone?: string;
  nickname?: string;
}

/** 取当前登录用户（JWT 解析结果） */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);

export interface JwtAdmin {
  adminId: number;
  username: string;
  role: string;
  nickname: string;
}

/** 取当前登录管理员（Admin JWT 解析结果） */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAdmin | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.adminUser;
  },
);

export const ROLES_KEY = 'roles';
/** 管理后台角色控制：@Roles('super_admin', 'content_ops') */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
