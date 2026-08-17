<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { STORY_CATEGORY_LABELS } from '@jiucaibox/shared';
import type { StoryCategory } from '@jiucaibox/shared';
import EmptyState from '@/components/EmptyState.vue';
import StoryCard from '@/components/StoryCard.vue';
import { useStoryStore } from '@/stores/story';

const router = useRouter();
const storyStore = useStoryStore();

type CategoryFilter = StoryCategory | 'all';

const chips = ref<{ label: string; value: CategoryFilter }[]>([
  { label: '全部', value: 'all' },
  ...(Object.keys(STORY_CATEGORY_LABELS) as StoryCategory[]).map((c) => ({
    label: STORY_CATEGORY_LABELS[c],
    value: c as CategoryFilter,
  })),
]);

const active = ref<CategoryFilter>('all');

watch(active, (val) => {
  storyStore.fetchStories(val);
});

function goStory(id: number) {
  router.push(`/stories/${id}`);
}

function goNew() {
  router.push('/stories/new');
}

function onLoad() {
  if (storyStore.finished) return;
  storyStore.fetchStories(active.value, storyStore.page + 1, true);
}

onMounted(() => {
  storyStore.fetchStories(active.value);
});
</script>

<template>
  <van-nav-bar title="韭菜的泪花" />
  <div class="stories-page">
    <!-- 分类筛选 chips -->
    <div class="stories-chips">
      <span
        v-for="chip in chips"
        :key="chip.value"
        class="stories-chip pressable"
        :class="{ 'stories-chip--on': active === chip.value }"
        @click="active = chip.value"
      >
        {{ chip.label }}
      </span>
    </div>

    <div class="page">
      <!-- 说出你的经历入口 -->
      <div class="card stories-entry pressable" @click="goNew">
        <span class="stories-entry__icon">💬</span>
        <div class="stories-entry__text">
          <div class="stories-entry__title">说出你的经历</div>
          <div class="text-aux">匿名分享，你的经历可能成为别人的路标</div>
        </div>
        <van-icon name="arrow" color="#757575" />
      </div>

      <van-list
        v-model:loading="storyStore.loading"
        :finished="storyStore.finished"
        finished-text="已经到底啦，抱抱你"
        @load="onLoad"
      >
        <StoryCard
          v-for="story in storyStore.stories"
          :key="story.id"
          :story="story"
          @click="(s) => goStory(s.id)"
        />
      </van-list>

      <EmptyState
        v-if="!storyStore.stories.length && !storyStore.loading"
        text="还没有故事，来说出你的经历"
        description="匿名分享，隐私由我们守护"
      >
        <template #action>
          <van-button round type="primary" size="small" @click="goNew">我要分享</van-button>
        </template>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
.stories-page {
  min-height: 100vh;
}

.stories-chips {
  display: flex;
  gap: 8px;
  padding: 12px 16px 4px;
  max-width: 640px;
  margin: 0 auto;
  overflow-x: auto;
  scrollbar-width: none;
}

.stories-chips::-webkit-scrollbar {
  display: none;
}

.stories-chip {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-sub);
  cursor: pointer;
}

.stories-chip--on {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.stories-entry {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stories-entry__icon {
  font-size: 26px;
}

.stories-entry__text {
  flex: 1;
}

.stories-entry__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}
</style>
