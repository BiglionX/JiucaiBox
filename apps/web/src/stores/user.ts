/**
 * 用户状态：登录态、个人资料、登录弹窗控制
 */
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { LoginResponse, UserProfile } from '@jiucaibox/shared';
import { authApi, userApi } from '@/api';
import {
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from '@/utils/request';
import { randomNickname } from '@/utils/format';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken());
  const profile = ref<UserProfile | null>(null);
  /** 全局登录弹窗可见性（App.vue 渲染 LoginModal） */
  const loginVisible = ref(false);

  const isLoggedIn = computed(() => Boolean(token.value));

  function applyLogin(res: LoginResponse) {
    setToken(res.token);
    token.value = res.token;
    profile.value = res.user;
  }

  function openLogin() {
    loginVisible.value = true;
  }

  function closeLogin() {
    loginVisible.value = false;
  }

  async function loginByPhone(phone: string, code: string) {
    const res = await authApi.loginByPhone({ phone, code });
    applyLogin(res);
  }

  /** 微信一键登录（MVP：openid 传空） */
  async function wechatLogin() {
    const res = await authApi.wechatLogin({
      openid: '',
      nickname: profile.value?.nickname || randomNickname(),
    });
    applyLogin(res);
  }

  async function fetchProfile() {
    if (!token.value) return null;
    profile.value = await userApi.getProfile();
    return profile.value;
  }

  async function updateProfile(payload: { nickname?: string; avatar?: string; bio?: string }) {
    const updated = await userApi.updateProfile(payload);
    profile.value = updated;
    return updated;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // 无状态登出，忽略错误，前端照常清理
    }
    clearAuth();
  }

  function clearAuth() {
    clearToken();
    token.value = '';
    profile.value = null;
  }

  // 401 统一处理：清 token 并弹出登录框
  setUnauthorizedHandler(() => {
    clearAuth();
    loginVisible.value = true;
  });

  return {
    token,
    profile,
    loginVisible,
    isLoggedIn,
    openLogin,
    closeLogin,
    loginByPhone,
    wechatLogin,
    fetchProfile,
    updateProfile,
    logout,
    clearAuth,
  };
});
