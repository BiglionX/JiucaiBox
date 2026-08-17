import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import type { Component } from 'vue';
import { message } from 'ant-design-vue';
import { INFO_KEY, TOKEN_KEY } from '@/utils/request';
import { MENU_ROLES } from '@/stores/auth';
import type { AdminRole } from '@jiucaibox/shared';

import AdminLayout from '@/layouts/AdminLayout.vue';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import CourseListView from '@/views/CourseListView.vue';
import AnalysisListView from '@/views/AnalysisListView.vue';
import StoryListView from '@/views/StoryListView.vue';
import RadioListView from '@/views/RadioListView.vue';
import UserListView from '@/views/UserListView.vue';
import LexiconView from '@/views/LexiconView.vue';
import StatsView from '@/views/StatsView.vue';
import LogsView from '@/views/LogsView.vue';

export interface AdminMenuMeta {
  title: string;
  menuKey: string;
  roles: AdminRole[];
}

/** 后台菜单配置（顺序即侧边栏顺序） */
export const ADMIN_MENUS: AdminMenuMeta[] = [
  { title: '仪表盘', menuKey: 'dashboard', roles: MENU_ROLES.dashboard },
  { title: '课程管理', menuKey: 'courses', roles: MENU_ROLES.courses },
  { title: '测评管理', menuKey: 'analysis', roles: MENU_ROLES.analysis },
  { title: '故事审核', menuKey: 'stories', roles: MENU_ROLES.stories },
  { title: '电台管理', menuKey: 'radio', roles: MENU_ROLES.radio },
  { title: '用户管理', menuKey: 'users', roles: MENU_ROLES.users },
  { title: '风险词库', menuKey: 'lexicon', roles: MENU_ROLES.lexicon },
  { title: '数据统计', menuKey: 'stats', roles: MENU_ROLES.stats },
  { title: '操作日志', menuKey: 'logs', roles: MENU_ROLES.logs },
];

const VIEWS: Record<string, Component> = {
  dashboard: DashboardView,
  courses: CourseListView,
  analysis: AnalysisListView,
  stories: StoryListView,
  radio: RadioListView,
  users: UserListView,
  lexicon: LexiconView,
  stats: StatsView,
  logs: LogsView,
};

const children: RouteRecordRaw[] = ADMIN_MENUS.map((m) => ({
  path: m.menuKey,
  name: m.menuKey,
  component: VIEWS[m.menuKey],
  meta: { title: m.title, menuKey: m.menuKey, roles: m.roles },
}));

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [...children, { path: ':pathMatch(.*)*', redirect: '/dashboard' }],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.afterEach((to) => {
  const title = to.meta?.title as string | undefined;
  document.title = title ? `${title} - 韭菜学院管理后台` : '韭菜学院管理后台';
});

router.beforeEach((to) => {
  const token = localStorage.getItem(TOKEN_KEY);

  // 已登录访问登录页 → 回首页
  if (to.path === '/login') {
    return token ? '/dashboard' : true;
  }

  // 未登录 → 登录页（记录来源）
  if (!token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // 角色校验（菜单隐藏之外的双保险，后端仍有 403 兜底）
  const roles = to.meta?.roles as AdminRole[] | undefined;
  if (roles && roles.length) {
    let currentRole: string | undefined;
    try {
      currentRole = (JSON.parse(localStorage.getItem(INFO_KEY) || 'null') as AdminUserLike | null)?.role;
    } catch {
      currentRole = undefined;
    }
    if (currentRole && !roles.includes(currentRole as AdminRole)) {
      message.warning('当前角色无权访问该页面');
      return '/dashboard';
    }
  }
  return true;
});

interface AdminUserLike {
  role?: string;
}

export default router;
