<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LoginModal from '@/components/LoginModal.vue';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const userStore = useUserStore();

/** 底部导航仅在 5 个一级 Tab 页显示 */
const TAB_PATHS = ['/home', '/analysis', '/courses', '/stories', '/mine'];
const showTabbar = computed(() => TAB_PATHS.includes(route.path));

const active = computed(() => {
  const path = route.path;
  if (path.startsWith('/analysis')) return '/analysis';
  if (path.startsWith('/courses') || path.startsWith('/course')) return '/courses';
  if (path.startsWith('/stories')) return '/stories';
  if (path.startsWith('/radio')) return '/radio';
  if (path.startsWith('/mine')) return '/mine';
  return '/home';
});
</script>

<template>
  <div class="app-shell">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <van-tabbar
      v-if="showTabbar"
      :model-value="active"
      :safe-area-inset-bottom="true"
      active-color="#2E7D32"
      inactive-color="#757575"
      class="app-tabbar"
    >
      <van-tabbar-item name="/home" icon="shield-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item name="/analysis" icon="search" to="/analysis">测评</van-tabbar-item>
      <van-tabbar-item name="/courses" icon="play-circle-o" to="/courses">课程</van-tabbar-item>
      <van-tabbar-item name="/stories" icon="like-o" to="/stories">泪花</van-tabbar-item>
      <van-tabbar-item name="/mine" icon="user-o" to="/mine">我的</van-tabbar-item>
    </van-tabbar>

    <!-- 全局登录弹窗 -->
    <LoginModal v-model:show="userStore.loginVisible" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-tabbar {
  max-width: 640px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
