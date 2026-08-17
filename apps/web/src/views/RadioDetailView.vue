<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import type { RadioEpisode } from '@jiucaibox/shared';
import { radioApi } from '@/api';
import { formatDateTime } from '@/utils/format';

const route = useRoute();
const router = useRouter();

const episode = ref<RadioEpisode | null>(null);
const loading = ref(true);
const sharing = ref(false);

async function load() {
  loading.value = true;
  try {
    episode.value = await radioApi.getDetail(route.params.id as string);
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

function openSource() {
  if (!episode.value?.sourceUrl) {
    showToast('暂无原文链接');
    return;
  }
  window.open(episode.value.sourceUrl, '_blank');
}

function goRelatedCourse() {
  if (!episode.value?.relatedCourseId) {
    showToast('暂未关联课程');
    return;
  }
  router.push(`/course/${episode.value.relatedCourseId}`);
}

async function share() {
  if (!episode.value) return;
  const shareData = {
    title: `${episode.value.title} · 韭菜学院`,
    text: episode.value.summary,
    url: window.location.href,
  };
  sharing.value = true;
  try {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (nav.share) {
      await nav.share(shareData);
    } else {
      // 降级：复制链接
      await navigator.clipboard.writeText(window.location.href);
      showToast('链接已复制');
    }
  } catch {
    // 用户取消分享，不提示
  } finally {
    sharing.value = false;
  }
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="电台速报" left-arrow @click-left="router.back()" />

  <div class="page" v-if="loading">
    <van-skeleton title :row="10" />
  </div>

  <template v-else-if="episode">
    <!-- 标题 + 来源 -->
    <div class="card">
      <div class="episode-title">{{ episode.title }}</div>
      <div class="episode-meta">
        <span class="chip episode-source">{{ episode.sourceLabel || '官方通报' }}</span>
        <span class="text-aux">{{ formatDateTime(episode.createdAt) }}</span>
      </div>
      <van-button
        v-if="episode.sourceUrl"
        size="small"
        round
        plain
        type="primary"
        icon="link-o"
        class="episode-source-btn"
        @click="openSource"
      >
        查看原文
      </van-button>
    </div>

    <!-- 事件速览 -->
    <div class="card">
      <div class="episode-section">事件速览</div>
      <div class="episode-summary">{{ episode.summary }}</div>
    </div>

    <!-- 套路拆解 -->
    <div class="card" v-if="episode.tricks.length">
      <div class="episode-section">套路拆解</div>
      <div v-for="(trick, i) in episode.tricks" :key="i" class="trick-item">
        <span class="trick-item__icon">⚠️</span>
        <div class="trick-item__body">
          <div class="trick-item__name">{{ trick.name }}</div>
          <div class="trick-item__desc">{{ trick.description }}</div>
        </div>
      </div>
    </div>

    <!-- 防割提醒 -->
    <div v-if="episode.warning" class="warning-block episode-warning">
      <div class="episode-warning__title">
        <van-icon name="warning-o" color="#FF9800" />
        防割提醒
      </div>
      {{ episode.warning }}
    </div>

    <!-- 关联学习 -->
    <van-button
      block
      round
      type="primary"
      class="episode-related"
      @click="goRelatedCourse"
    >
      <van-icon name="play-circle-o" />
      学习相关防割课程
    </van-button>

    <van-button block round plain type="primary" :loading="sharing" class="episode-share" @click="share">
      <van-icon name="share-o" />
      分享给家人朋友
    </van-button>
  </template>
</template>

<style scoped>
.episode-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.6;
  margin-bottom: 8px;
}

.episode-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.episode-source {
  background: var(--danger-bg);
  color: var(--danger);
}

.episode-section {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.episode-summary {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.9;
}

.trick-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.trick-item:last-child {
  border-bottom: none;
}

.trick-item__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.trick-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.trick-item__desc {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.6;
}

.episode-warning__title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #e65100;
  margin-bottom: 4px;
}

.episode-related {
  margin-top: 8px;
}

.episode-share {
  margin-top: 10px;
}
</style>
