<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import type { AppNotification } from '@jiucaibox/shared';
import { userApi } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import { timeAgo } from '@/utils/format';

const router = useRouter();

const list = ref<AppNotification[]>([]);
const loading = ref(true);

const TYPE_META: Record<AppNotification['type'], { icon: string; color: string }> = {
  system: { icon: 'volume-o', color: '#4CAF50' },
  review: { icon: 'edit', color: '#FF9800' },
  interaction: { icon: 'chat-o', color: '#2196F3' },
};

async function load() {
  loading.value = true;
  try {
    list.value = await userApi.getNotifications();
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function markRead(item: AppNotification) {
  if (item.read) return;
  item.read = true;
  try {
    await userApi.markNotificationsRead([item.id]);
  } catch {
    // 已提示
  }
}

async function markAllRead() {
  if (!list.value.some((n) => !n.read)) {
    showToast('没有未读通知');
    return;
  }
  list.value.forEach((n) => (n.read = true));
  try {
    await userApi.markAllNotificationsRead();
    showToast('已全部标记为已读');
  } catch {
    // 已提示
  }
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="消息通知" left-arrow @click-left="router.back()">
    <template #right>
      <span class="read-all pressable" @click="markAllRead">全部已读</span>
    </template>
  </van-nav-bar>

  <div class="page">
    <div v-if="list.length">
      <div
        v-for="item in list"
        :key="item.id"
        class="card notify-item pressable"
        @click="markRead(item)"
      >
        <span
          class="notify-item__icon"
          :style="{ background: `${TYPE_META[item.type].color}1A`, color: TYPE_META[item.type].color }"
        >
          <van-icon :name="TYPE_META[item.type].icon" size="18" />
        </span>
        <div class="notify-item__body">
          <div class="notify-item__head">
            <span class="notify-item__title">{{ item.title }}</span>
            <span v-if="!item.read" class="notify-item__dot" />
          </div>
          <div class="notify-item__content">{{ item.content }}</div>
          <div class="text-aux">{{ timeAgo(item.createdAt) }}</div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!loading"
      text="暂无通知"
      description="有新的审核结果或系统公告时会通知你"
    />
  </div>
</template>

<style scoped>
.read-all {
  font-size: 13px;
  color: var(--text-sub);
}

.notify-item {
  display: flex;
  gap: 10px;
}

.notify-item__icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notify-item__body {
  flex: 1;
  min-width: 0;
}

.notify-item__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.notify-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.notify-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  flex-shrink: 0;
}

.notify-item__content {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.6;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
