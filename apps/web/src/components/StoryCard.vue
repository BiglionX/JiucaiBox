<script setup lang="ts">
import { computed } from 'vue';
import { STORY_CATEGORY_LABELS } from '@jiucaibox/shared';
import type { StoryItem } from '@jiucaibox/shared';
import { emojiAvatar, formatMoney, timeAgo, truncate } from '@/utils/format';

const props = defineProps<{ story: StoryItem }>();
const emit = defineEmits<{ (e: 'click', story: StoryItem): void }>();

const categoryLabel = computed(() => STORY_CATEGORY_LABELS[props.story.category] ?? '其他');
const summary = computed(() => truncate(props.story.content, 80));
</script>

<template>
  <div class="story-card card card--tappable pressable" @click="emit('click', story)">
    <div class="story-card__head">
      <span class="story-card__avatar">{{ emojiAvatar(story.id) }}</span>
      <div class="story-card__meta">
        <div class="story-card__nickname">{{ story.userNickname }}</div>
        <div class="story-card__time">{{ timeAgo(story.createdAt) }}</div>
      </div>
      <span class="chip story-card__cat">{{ categoryLabel }}</span>
    </div>

    <div class="story-card__title">{{ story.title }}</div>
    <div class="story-card__summary">{{ summary }}</div>

    <div class="story-card__foot">
      <span v-if="story.lossAmount !== null && story.lossAmount !== undefined" class="story-card__loss">
        损失 {{ formatMoney(story.lossAmount) }}
      </span>
      <span v-else class="story-card__loss story-card__loss--none">损失未知</span>
      <div class="story-card__stats">
        <span class="story-card__stat">
          <van-icon name="like-o" />
          {{ story.hugCount }}
        </span>
        <span class="story-card__stat">
          <van-icon name="comment-o" />
          {{ story.commentCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-card__head {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.story-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 10px;
  flex-shrink: 0;
}

.story-card__meta {
  flex: 1;
  min-width: 0;
}

.story-card__nickname {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.story-card__time {
  font-size: 12px;
  color: var(--text-sub);
}

.story-card__cat {
  background: var(--bg);
  color: var(--text-sub);
}

.story-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
  line-height: 1.5;
}

.story-card__summary {
  font-size: 14px;
  color: var(--text-sub);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.story-card__loss {
  font-size: 14px;
  font-weight: 700;
  color: var(--warning);
}

.story-card__loss--none {
  color: var(--text-sub);
  font-weight: 400;
}

.story-card__stats {
  display: flex;
  gap: 12px;
}

.story-card__stat {
  font-size: 12px;
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>
