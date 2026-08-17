<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog } from 'vant';
import { userApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { emojiAvatar } from '@/utils/format';

const router = useRouter();
const userStore = useUserStore();

const unreadCount = ref(0);

const profile = computed(() => userStore.profile);
const stats = computed(() => profile.value?.stats);

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  badge?: boolean;
}

const menuGroups: { items: MenuItem[] }[] = [
  {
    items: [
      { icon: 'records-o', label: '学习记录', path: '/mine/learning' },
      { icon: 'search', label: '我的测评', path: '/mine/analysis' },
      { icon: 'like-o', label: '我的故事', path: '/mine/stories' },
      { icon: 'certificate', label: '我的证书', path: '/mine/certificates' },
      { icon: 'chat-o', label: '我的互动', path: '/mine/interactions' },
      { icon: 'bell', label: '消息通知', path: '/mine/notifications', badge: true },
    ],
  },
];

function requireLogin(action?: () => void) {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  action?.();
}

function go(path: string) {
  requireLogin(() => router.push(path));
}

function goEdit() {
  requireLogin(() => router.push('/mine/edit'));
}

async function loadData() {
  if (!userStore.isLoggedIn) return;
  try {
    await userStore.fetchProfile();
  } catch {
    // 已提示
  }
  try {
    const notifications = await userApi.getNotifications();
    unreadCount.value = notifications.filter((n) => !n.read).length;
  } catch {
    unreadCount.value = 0;
  }
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出当前账号吗？',
      confirmButtonText: '退出',
      confirmButtonColor: '#F44336',
    });
  } catch {
    return; // 用户取消
  }
  await userStore.logout();
}

onMounted(loadData);
</script>

<template>
  <van-nav-bar title="我的" />

  <div class="page mine-page">
    <!-- 用户信息头部 -->
    <div class="card mine-head" @click="userStore.isLoggedIn ? goEdit() : userStore.openLogin()">
      <span class="mine-head__avatar">{{ profile ? emojiAvatar(profile.id) : '👤' }}</span>
      <div class="mine-head__info">
        <template v-if="profile">
          <div class="mine-head__name">
            {{ profile.nickname }}
            <span class="chip mine-head__anon">匿名</span>
          </div>
          <div class="text-aux">{{ profile.bio || '这个人很懒，还没有写简介' }}</div>
        </template>
        <template v-else>
          <div class="mine-head__name">点击登录</div>
          <div class="text-aux">登录后可提交测评、发布故事、记录学习</div>
        </template>
      </div>
      <van-icon v-if="profile" name="edit" color="#757575" />
      <van-icon v-else name="arrow" color="#757575" />
    </div>

    <!-- 数据概览 -->
    <div v-if="profile" class="card mine-stats">
      <div class="mine-stat">
        <div class="mine-stat__num">{{ stats?.courseCount ?? 0 }}</div>
        <div class="text-aux">已学课程</div>
      </div>
      <div class="mine-stat">
        <div class="mine-stat__num">{{ stats?.analysisCount ?? 0 }}</div>
        <div class="text-aux">测评次数</div>
      </div>
      <div class="mine-stat">
        <div class="mine-stat__num">{{ stats?.storyCount ?? 0 }}</div>
        <div class="text-aux">我的故事</div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="card mine-menu">
      <div
        v-for="item in menuGroups[0].items"
        :key="item.path"
        class="mine-menu__item pressable"
        @click="go(item.path)"
      >
        <van-icon :name="item.icon" size="18" color="#4CAF50" />
        <span class="mine-menu__label">{{ item.label }}</span>
        <span v-if="item.badge && unreadCount > 0" class="mine-menu__badge">{{ unreadCount }}</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
    </div>

    <!-- 设置 -->
    <div class="card mine-menu">
      <div class="mine-menu__item pressable" @click="router.push('/mine/settings')">
        <van-icon name="setting-o" size="18" color="#757575" />
        <span class="mine-menu__label">设置</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
    </div>

    <!-- 退出登录 -->
    <div v-if="profile" class="mine-logout pressable" @click="handleLogout">退出登录</div>

    <div class="text-aux mine-foot">
      公益教育平台 · 匿名优先 · 每一滴泪花，都是路标
    </div>
  </div>
</template>

<style scoped>
.mine-page {
  padding-top: 8px;
}

.mine-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mine-head__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.mine-head__info {
  flex: 1;
  min-width: 0;
}

.mine-head__name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.mine-head__anon {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.mine-stats {
  display: flex;
  padding: 20px 8px;
}

.mine-stat {
  flex: 1;
  text-align: center;
}

.mine-stat__num {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-dark);
}

.mine-menu {
  padding: 4px 16px;
}

.mine-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.mine-menu__item:last-child {
  border-bottom: none;
}

.mine-menu__label {
  flex: 1;
  font-size: 14px;
  color: var(--text-main);
}

.mine-menu__badge {
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.mine-logout {
  text-align: center;
  color: var(--danger);
  font-size: 14px;
  background: var(--card);
  border-radius: 8px;
  padding: 14px 0;
  margin-top: 16px;
}

.mine-foot {
  text-align: center;
  margin-top: 20px;
}
</style>
