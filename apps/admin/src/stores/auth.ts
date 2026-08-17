import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { AdminRole, AdminUser } from '@jiucaibox/shared';
import { adminLogin } from '@/api';
import { INFO_KEY, TOKEN_KEY } from '@/utils/request';

/** 菜单 → 允许访问的角色（菜单过滤的唯一数据源） */
export const MENU_ROLES: Record<string, AdminRole[]> = {
  dashboard: ['super_admin', 'content_ops', 'reviewer', 'support', 'analyst'],
  courses: ['super_admin', 'content_ops'],
  analysis: ['super_admin', 'reviewer', 'support'],
  stories: ['super_admin', 'reviewer', 'support'],
  radio: ['super_admin', 'content_ops'],
  users: ['super_admin', 'support'],
  lexicon: ['super_admin', 'content_ops'],
  stats: ['super_admin', 'analyst'],
  logs: ['super_admin'],
};

function readInfo(): AdminUser | null {
  try {
    const raw = localStorage.getItem(INFO_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '');
  const adminInfo = ref<AdminUser | null>(readInfo());

  const isLoggedIn = computed(() => !!token.value);
  const role = computed<AdminRole | ''>(() => adminInfo.value?.role ?? '');

  const isSuperAdmin = computed(() => role.value === 'super_admin');
  const isContentOps = computed(() => role.value === 'super_admin' || role.value === 'content_ops');
  const isReviewer = computed(() => role.value === 'super_admin' || role.value === 'reviewer');
  const isSupport = computed(() => role.value === 'super_admin' || role.value === 'support');
  const isAnalyst = computed(() => role.value === 'super_admin' || role.value === 'analyst');

  async function login(username: string, password: string) {
    const res = await adminLogin(username, password);
    token.value = res.token;
    adminInfo.value = res.admin;
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(INFO_KEY, JSON.stringify(res.admin));
  }

  function logout() {
    token.value = '';
    adminInfo.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(INFO_KEY);
  }

  /** 菜单过滤：该角色是否允许访问 menuKey 对应菜单 */
  function can(checkRole: AdminRole | '', menuKey: string): boolean {
    const allow = MENU_ROLES[menuKey];
    if (!allow) return false;
    return allow.includes(checkRole as AdminRole);
  }

  return {
    token,
    adminInfo,
    isLoggedIn,
    role,
    isSuperAdmin,
    isContentOps,
    isReviewer,
    isSupport,
    isAnalyst,
    login,
    logout,
    can,
  };
});
