/**
 * 模块 01 · 账号种子
 *  - 管理后台账号（super_admin）
 *  - 演示用户（用于泪花社区作者）
 *
 * 幂等策略：使用 upsert by unique 字段
 *  - AdminUser.username
 *  - User.phone
 */
import * as bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import type { SeedModule } from './_shared';

export const seedAccounts: SeedModule = async (prisma) => {
  // 管理账号
  const adminUsername = process.env.ADMIN_INIT_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_INIT_PASSWORD || 'jiucai123456';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {}, // 已有账号不重置密码（避免覆盖演示之外的运维改动）
    create: {
      username: adminUsername,
      password: adminHash,
      nickname: '超级管理员',
      role: 'super_admin',
    },
  });

  // 演示用户（多个，覆盖不同社区身份，便于冷启动展示）
  const demoUsers = [
    { phone: '13800138000', nickname: '韭菜A001', bio: '想搞清直播培训的水有多深' },
    { phone: '13900139000', nickname: '韭菜E118', bio: '被精神传销骗过，过来人给你避坑' },
    { phone: '13700137000', nickname: '韭菜F233', bio: '加盟踩坑15万，希望后来人别再上头' },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: { nickname: u.nickname, bio: u.bio },
      create: { ...u, avatar: '', isAnonymous: true },
    });
  }
};
