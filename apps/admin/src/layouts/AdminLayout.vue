<template>
  <a-layout style="min-height: 100vh">
    <!-- 左侧菜单 -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible theme="dark" width="220">
      <div class="logo">
        <span class="logo-icon">韭</span>
        <span v-if="!collapsed" class="logo-text">韭菜学院 · 管理后台</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="onMenuClick"
      >
        <a-menu-item v-for="item in menus" :key="item.key">
          <component :is="item.icon" />
          <span>{{ item.title }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部栏 -->
      <a-layout-header class="header">
        <div class="header-title">{{ currentTitle }}</div>
        <div class="header-right">
          <a-dropdown>
            <span class="user-box">
              <a-avatar size="small" style="background-color: #1677ff">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="user-nickname">{{ auth.adminInfo?.nickname || auth.adminInfo?.username }}</span>
              <a-tag class="role-tag" color="blue">{{ roleLabel }}</a-tag>
              <DownOutlined class="user-arrow" />
            </span>
            <template #overlay>
              <a-menu @click="onUserMenuClick">
                <a-menu-item key="logout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Modal, message } from 'ant-design-vue';
import {
  DashboardOutlined,
  PlayCircleOutlined,
  FileSearchOutlined,
  HeartOutlined,
  AudioOutlined,
  TeamOutlined,
  TagsOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { ADMIN_MENUS } from '@/router';
import { ROLE_LABELS } from '@/constants';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const collapsed = ref(false);

const roleLabel = computed(() => ROLE_LABELS[auth.role as keyof typeof ROLE_LABELS] || '未知角色');
const currentTitle = computed(() => (route.meta?.title as string) || '');
const selectedKeys = computed(() => [route.path]);

const ICONS: Record<string, unknown> = {
  dashboard: DashboardOutlined,
  courses: PlayCircleOutlined,
  analysis: FileSearchOutlined,
  stories: HeartOutlined,
  radio: AudioOutlined,
  users: TeamOutlined,
  lexicon: TagsOutlined,
  stats: BarChartOutlined,
  logs: FileTextOutlined,
};

/** 按角色过滤后的菜单 */
const menus = computed(() =>
  ADMIN_MENUS.filter((m) => auth.can(auth.role, m.menuKey)).map((m) => ({
    key: `/${m.menuKey}`,
    icon: ICONS[m.menuKey] as Component,
    title: m.title,
  })),
);

function onMenuClick({ key }: { key: string | number }) {
  router.push(String(key));
}

function onUserMenuClick({ key }: { key: string | number }) {
  if (key === 'logout') {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      okText: '退出',
      cancelText: '取消',
      onOk: () => {
        auth.logout();
        message.success('已退出登录');
        router.replace('/login');
      },
    });
  }
}
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
}
.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f5222d, #fa8c16);
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}
.logo-text {
  overflow: hidden;
  text-overflow: ellipsis;
}
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  height: 56px;
  line-height: 56px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}
.user-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0 8px;
}
.user-nickname {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}
.role-tag {
  margin-inline-end: 0;
}
.user-arrow {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.content {
  padding: 24px;
  background: #f5f5f5;
  overflow: auto;
}
</style>
