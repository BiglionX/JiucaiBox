<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import type { StoryItem, StoryStatus } from '@jiucaibox/shared';
import { userApi } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import { formatDateTime } from '@/utils/format';

const router = useRouter();

const list = ref<StoryItem[]>([]);
const loading = ref(true);
const active = ref<'all' | StoryStatus>('all');

const STATUS_LABELS: Record<StoryStatus, string> = {
  pending: '待审核',
  approved: '已发布',
  rejected: '已驳回',
};

const STATUS_COLORS: Record<StoryStatus, string> = {
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
};

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已发布', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
] as const;

const filtered = computed(() => {
  if (active.value === 'all') return list.value;
  return list.value.filter((s) => s.status === active.value);
});

async function load() {
  loading.value = true;
  try {
    list.value = await userApi.getMyStories();
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

function goDetail(story: StoryItem) {
  if (story.status === 'approved') {
    router.push(`/stories/${story.id}`);
  } else if (story.status === 'rejected') {
    showToast('该故事已被驳回，可修改后重新提交');
  } else {
    showToast('审核中，请耐心等待');
  }
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="我的故事" left-arrow @click-left="router.back()" />

  <van-tabs v-model:active="active" sticky color="#4CAF50">
    <van-tab v-for="tab in tabs" :key="tab.value" :title="tab.label" :name="tab.value" />
  </van-tabs>

  <div class="page">
    <div v-if="filtered.length">
      <div
        v-for="story in filtered"
        :key="story.id"
        class="card mine-story pressable"
        @click="goDetail(story)"
      >
        <div class="mine-story__head">
          <div class="mine-story__title">{{ story.title }}</div>
          <span
            class="chip mine-story__status"
            :style="{ color: STATUS_COLORS[story.status], background: `${STATUS_COLORS[story.status]}1A` }"
          >
            {{ STATUS_LABELS[story.status] }}
          </span>
        </div>
        <div class="mine-story__meta">
          <span class="text-aux">{{ formatDateTime(story.createdAt) }}</span>
          <span class="text-aux">{{ story.hugCount }} 抱抱 · {{ story.commentCount }} 评论</span>
        </div>
        <div v-if="story.status === 'rejected' && story.rejectReason" class="mine-story__reject">
          驳回原因：{{ story.rejectReason }}
        </div>
        <div v-else-if="story.status === 'pending'" class="mine-story__pending">
          审核中，请耐心等待
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!loading"
      text="还没有发布过故事"
      description="说出你的经历，帮助更多人避坑"
    >
      <template #action>
        <van-button round type="primary" size="small" @click="router.push('/stories/new')">
          去分享
        </van-button>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.mine-story__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mine-story__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
  margin-right: 8px;
}

.mine-story__meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mine-story__reject {
  font-size: 12px;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 6px;
  padding: 6px 10px;
}

.mine-story__pending {
  font-size: 12px;
  color: var(--warning);
}
</style>
