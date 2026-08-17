<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { RadioEpisode } from '@jiucaibox/shared';
import { radioApi } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import { formatDateTime } from '@/utils/format';

const router = useRouter();

const list = ref<RadioEpisode[]>([]);
const loading = ref(false);
const finished = ref(false);
const page = ref(1);

async function load(append = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await radioApi.getList({ page: page.value, pageSize: 10 });
    list.value = append ? [...list.value, ...res.list] : res.list;
    finished.value = list.value.length >= res.total;
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

function onLoad() {
  if (finished.value) return;
  page.value += 1;
  load(true);
}

function goDetail(id: number) {
  router.push(`/radio/${id}`);
}

onMounted(() => load());
</script>

<template>
  <van-nav-bar title="韭菜电台" />

  <div class="page">
    <div class="card radio-intro">
      <div class="radio-intro__title">
        <van-icon name="volume-o" color="#F44336" size="18" />
        韭菜电台
      </div>
      <div class="text-aux">真实骗局拆解速报，来源为官方通报与权威媒体</div>
    </div>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多期数了"
      @load="onLoad"
    >
      <div
        v-for="ep in list"
        :key="ep.id"
        class="card radio-item pressable"
        @click="goDetail(ep.id)"
      >
        <div class="radio-item__head">
          <span class="radio-item__no">第 {{ ep.id }} 期</span>
          <span class="chip radio-item__source">{{ ep.sourceLabel || '官方通报' }}</span>
        </div>
        <div class="radio-item__title">{{ ep.title }}</div>
        <div class="radio-item__summary">{{ ep.summary }}</div>
        <div class="text-aux">{{ formatDateTime(ep.createdAt) }}</div>
      </div>
    </van-list>

    <EmptyState
      v-if="!list.length && !loading"
      text="电台内容准备中"
      description="我们正在整理最新的骗局速报"
    />
  </div>
</template>

<style scoped>
.radio-intro__title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.radio-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.radio-item__no {
  font-size: 12px;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-bg);
  padding: 1px 8px;
  border-radius: 4px;
}

.radio-item__source {
  background: var(--bg);
  color: var(--text-sub);
}

.radio-item__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
  line-height: 1.5;
}

.radio-item__summary {
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
