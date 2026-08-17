<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { STORY_CATEGORY_LABELS } from '@jiucaibox/shared';
import type { CourseItem, StoryComment, StoryItem } from '@jiucaibox/shared';
import { courseApi, storyApi } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import HugButton from '@/components/HugButton.vue';
import { useUserStore } from '@/stores/user';
import { emojiAvatar, formatDateTime, formatMoney } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const story = ref<StoryItem | null>(null);
const comments = ref<StoryComment[]>([]);
const relatedCourses = ref<CourseItem[]>([]);
const loading = ref(true);
const commentText = ref('');
const posting = ref(false);
const commentLoading = ref(false);

const paragraphs = computed(() => {
  if (!story.value) return [];
  return story.value.content
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
});

async function load() {
  loading.value = true;
  try {
    story.value = await storyApi.getStoryDetail(route.params.id as string);
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

async function loadComments() {
  commentLoading.value = true;
  try {
    comments.value = await storyApi.getComments(route.params.id as string);
  } catch {
    comments.value = [];
  } finally {
    commentLoading.value = false;
  }
}

async function loadRelated() {
  try {
    const category = story.value?.category;
    const courseCategory =
      category === 'live' || category === 'finance' || category === 'franchise'
        ? category
        : 'truth';
    const res = await courseApi.getCourses({ category: courseCategory, pageSize: 3 });
    relatedCourses.value = res.list;
  } catch {
    relatedCourses.value = [];
  }
}

async function submitComment() {
  const content = commentText.value.trim();
  if (!content) {
    showToast('说点什么再发送吧');
    return;
  }
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  posting.value = true;
  try {
    const comment = await storyApi.addComment(route.params.id as string, content);
    comments.value.push(comment);
    commentText.value = '';
    if (story.value) story.value.commentCount += 1;
    showToast('评论已发布');
  } catch {
    // 已提示
  } finally {
    posting.value = false;
  }
}

function onHugged() {
  if (story.value) story.value.hugCount += 1;
}

onMounted(() => {
  load().then(() => {
    loadComments();
    loadRelated();
  });
});
</script>

<template>
  <van-nav-bar title="故事详情" left-arrow @click-left="router.back()" />

  <div class="page" v-if="loading">
    <van-skeleton title :row="10" />
  </div>

  <template v-else-if="story">
    <!-- 头部 -->
    <div class="card story-head">
      <div class="story-head__user">
        <span class="story-head__avatar">{{ emojiAvatar(story.id) }}</span>
        <div>
          <div class="story-head__nickname">{{ story.userNickname }}</div>
          <div class="text-aux">{{ formatDateTime(story.createdAt) }}</div>
        </div>
        <span class="chip story-head__cat">
          {{ STORY_CATEGORY_LABELS[story.category] ?? '其他' }}
        </span>
      </div>
      <div class="story-head__title">{{ story.title }}</div>
    </div>

    <!-- 正文 -->
    <div class="card">
      <p v-for="(p, i) in paragraphs" :key="i" class="story-paragraph">{{ p }}</p>

      <div v-if="story.lossAmount !== null && story.lossAmount !== undefined" class="story-loss">
        <span class="story-loss__label">损失金额</span>
        <span class="story-loss__amount">{{ formatMoney(story.lossAmount) }}</span>
      </div>

      <div v-if="story.lesson" class="quote-block">
        <div class="story-lesson__label">「我学到的教训」</div>
        {{ story.lesson }}
      </div>
    </div>

    <!-- 图片横滑 -->
    <div v-if="story.images.length" class="story-images">
      <van-image
        v-for="(img, i) in story.images"
        :key="i"
        :src="img"
        width="140"
        height="100"
        fit="cover"
        radius="8"
        lazy-load
      />
    </div>

    <!-- 抱抱 -->
    <div class="card story-hug flex-center">
      <HugButton
        :story-id="story.id"
        :count="story.hugCount"
        :hugged="story.hugged"
        size="lg"
        @hugged="onHugged"
      />
      <div class="text-aux story-hug__tip">点一下抱抱，给对方一点温暖</div>
    </div>

    <!-- 评论区 -->
    <div class="section-title">
      <span>评论（{{ comments.length }}）</span>
    </div>

    <div class="card" v-if="comments.length">
      <div v-for="c in comments" :key="c.id" class="comment-item">
        <span class="comment-item__avatar">{{ emojiAvatar(c.id) }}</span>
        <div class="comment-item__body">
          <div class="comment-item__head">
            <span class="comment-item__nick">{{ c.userNickname }}</span>
            <span class="text-aux">{{ formatDateTime(c.createdAt) }}</span>
          </div>
          <div class="comment-item__content">{{ c.content }}</div>
        </div>
      </div>
    </div>
    <EmptyState v-else text="还没有评论，来给 TA 一点鼓励" />

    <div class="comment-input card">
      <van-field
        v-model="commentText"
        :maxlength="500"
        placeholder="友善评论，禁止嘲讽与攻击（匿名）"
        rows="1"
        autosize
        type="textarea"
        :border="false"
      />
      <van-button
        type="primary"
        size="small"
        round
        :loading="posting"
        @click="submitComment"
      >
        发送
      </van-button>
    </div>

    <!-- 相似经历的人还看了 -->
    <div class="section-title">
      <span>相似经历的人还看了</span>
    </div>
    <div class="card" v-if="relatedCourses.length">
      <div
        v-for="course in relatedCourses"
        :key="course.id"
        class="related-course pressable"
        @click="router.push(`/course/${course.id}`)"
      >
        <van-image :src="course.coverUrl" width="72" height="56" fit="cover" radius="6" lazy-load>
          <template #error>📚</template>
        </van-image>
        <div class="related-course__info">
          <div class="related-course__title">{{ course.title }}</div>
          <div class="text-aux">{{ course.description }}</div>
        </div>
        <van-icon name="arrow" color="#757575" />
      </div>
    </div>
    <div v-else class="card text-aux" style="text-align: center">
      暂时没有相关课程推荐
    </div>
  </template>
</template>

<style scoped>
.story-head__user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.story-head__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.story-head__nickname {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.story-head__cat {
  margin-left: auto;
  background: var(--bg);
  color: var(--text-sub);
}

.story-head__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.5;
}

.story-paragraph {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.9;
  margin: 0 0 12px;
}

.story-loss {
  display: flex;
  align-items: baseline;
  gap: 8px;
  background: var(--warning-bg);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 8px 0 12px;
}

.story-loss__label {
  font-size: 13px;
  color: var(--text-sub);
}

.story-loss__amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--warning);
}

.story-lesson__label {
  font-size: 12px;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.story-images {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scrollbar-width: none;
}

.story-images::-webkit-scrollbar {
  display: none;
}

.story-hug {
  flex-direction: column;
  gap: 8px;
  padding: 20px 16px;
}

.story-hug__tip {
  margin-top: 4px;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-item__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.comment-item__body {
  flex: 1;
  min-width: 0;
}

.comment-item__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.comment-item__nick {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.comment-item__content {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.7;
  word-break: break-word;
}

.comment-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  position: sticky;
  bottom: 0;
}

.comment-input .van-field {
  flex: 1;
}

.related-course {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.related-course:last-child {
  border-bottom: none;
}

.related-course__info {
  flex: 1;
  min-width: 0;
}

.related-course__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
