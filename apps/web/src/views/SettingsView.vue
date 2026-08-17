<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { userApi } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

/** 大字模式：持久化到 localStorage，切换立即生效 */
const largeText = ref(localStorage.getItem('jiucaibox_large_text') === '1');
const notifySwitch = ref(localStorage.getItem('jiucaibox_notify') !== '0');

function toggleLargeText(checked: boolean) {
  largeText.value = checked;
  document.documentElement.classList.toggle('large-text', checked);
  localStorage.setItem('jiucaibox_large_text', checked ? '1' : '0');
}

function toggleNotify(checked: boolean) {
  notifySwitch.value = checked;
  localStorage.setItem('jiucaibox_notify', checked ? '1' : '0');
  showToast(checked ? '已开启互动通知' : '已关闭互动通知');
}

async function clearCache() {
  try {
    await showConfirmDialog({
      title: '清除缓存',
      message: '将清除本地图片缓存与临时数据，不影响登录状态与学习记录。',
      confirmButtonText: '清除',
    });
  } catch {
    return;
  }
  // 保留登录态与设置项，仅清理临时数据
  const keys = ['jiucaibox_large_text', 'jiucaibox_notify', 'jiucaibox_token'];
  for (const key of Object.keys(localStorage)) {
    if (!keys.includes(key)) localStorage.removeItem(key);
  }
  showToast('缓存已清除');
}

async function clearLearning() {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  try {
    await showConfirmDialog({
      title: '清空学习记录',
      message: '将删除所有学习进度，此操作不可恢复。确定继续吗？',
      confirmButtonText: '清空',
      confirmButtonColor: '#F44336',
    });
  } catch {
    return;
  }
  try {
    await userApi.clearLearning();
    showToast('学习记录已清空');
  } catch {
    // 已提示
  }
}

async function deleteAccount() {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  // 第一次确认
  try {
    await showConfirmDialog({
      title: '账号注销',
      message: '注销后账号与全部个人数据将被永久删除，且无法恢复。',
      confirmButtonText: '继续',
      confirmButtonColor: '#F44336',
    });
  } catch {
    return;
  }
  // 第二次确认 + 冷静期提示
  try {
    await showConfirmDialog({
      title: '确定注销吗',
      message: '账号注销后数据保留 7 天冷静期，冷静期内可联系客服恢复；7 天后数据将永久删除。',
      confirmButtonText: '确认注销',
      confirmButtonColor: '#F44336',
      cancelButtonText: '我再想想',
    });
  } catch {
    return;
  }
  try {
    await userApi.deleteAccount();
    await userStore.logout();
    showToast('账号已注销');
    router.replace('/home');
  } catch {
    // 已提示
  }
}
</script>

<template>
  <van-nav-bar title="设置" left-arrow @click-left="router.back()" />

  <div class="page">
    <!-- 显示设置 -->
    <div class="card settings-group">
      <div class="settings-item">
        <span class="settings-item__label">大字模式</span>
        <van-switch
          :model-value="largeText"
          size="22"
          active-color="#4CAF50"
          @update:model-value="toggleLargeText"
        />
      </div>
      <div class="settings-item">
        <span class="settings-item__label">互动通知</span>
        <van-switch
          :model-value="notifySwitch"
          size="22"
          active-color="#4CAF50"
          @update:model-value="toggleNotify"
        />
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card settings-group">
      <div class="settings-item pressable" @click="clearCache">
        <span class="settings-item__label">清除缓存</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
      <div class="settings-item pressable" @click="clearLearning">
        <span class="settings-item__label settings-item__label--danger">清空学习记录</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
    </div>

    <!-- 关于与合规 -->
    <div class="card settings-group">
      <div class="settings-item pressable" @click="router.push('/about')">
        <span class="settings-item__label">关于我们</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
      <div class="settings-item pressable" @click="router.push('/disclaimer')">
        <span class="settings-item__label">免责声明</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
      <div class="settings-item pressable" @click="router.push('/privacy')">
        <span class="settings-item__label">隐私政策</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
      <div class="settings-item pressable" @click="router.push('/terms')">
        <span class="settings-item__label">用户协议</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
    </div>

    <!-- 账号 -->
    <div class="card settings-group">
      <div class="settings-item pressable" @click="deleteAccount">
        <span class="settings-item__label settings-item__label--danger">账号注销</span>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
    </div>

    <div class="text-aux mt16" style="text-align: center">
      韭菜学院 · 公益防割教育平台 v0.1.0
    </div>
  </div>
</template>

<style scoped>
.settings-group {
  padding: 4px 16px;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item__label {
  font-size: 14px;
  color: var(--text-main);
}

.settings-item__label--danger {
  color: var(--danger);
}
</style>
