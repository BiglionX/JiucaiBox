<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  COURSE_DISCLAIMER,
  COURSE_CATEGORY_LABELS,
  COURSE_DIFFICULTY_LABELS,
  COURSE_DIFFICULTY_COLORS,
  TARGET_AUDIENCE_LABELS,
} from '@jiucaibox/shared';
import type {
  CourseDetail,
  CourseDifficulty,
  QuizQuestion,
  TargetAudience,
  VideoItem,
} from '@jiucaibox/shared';
import { courseApi } from '@/api';
import QuizCard from '@/components/QuizCard.vue';
import TruthPopup from '@/components/TruthPopup.vue';
import { useUserStore } from '@/stores/user';
import { formatDuration } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const course = ref<CourseDetail | null>(null);
const quizzes = ref<QuizQuestion[]>([]);
const loading = ref(true);
const quizLoading = ref(true);

const truthVisible = ref(false);
const truthContent = ref('');

const categoryLabel = computed(() =>
  course.value ? (COURSE_CATEGORY_LABELS[course.value.category] ?? '课程') : '',
);

const difficulty = computed<CourseDifficulty>(() => course.value?.difficulty ?? 'entry');
const difficultyLabel = computed(() => COURSE_DIFFICULTY_LABELS[difficulty.value]);
const difficultyColor = computed(() => COURSE_DIFFICULTY_COLORS[difficulty.value]);
const audience = computed<TargetAudience>(() => course.value?.targetAudience ?? 'all');
const audienceLabel = computed(() => TARGET_AUDIENCE_LABELS[audience.value]);
const estimated = computed(() => course.value?.estimatedMinutes ?? 0);
const summary = computed(() => course.value?.summary ?? '');
const outcomes = computed<string[]>(() => course.value?.outcomes ?? []);
const warningTips = computed<string[]>(() => course.value?.warningTips ?? []);

async function load() {
  loading.value = true;
  try {
    course.value = await courseApi.getCourseDetail(route.params.id as string);
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

async function loadQuiz() {
  quizLoading.value = true;
  try {
    quizzes.value = await courseApi.getQuiz(route.params.id as string);
  } catch {
    quizzes.value = [];
  } finally {
    quizLoading.value = false;
  }
}

/** 点击视频：新窗口打开；返回后标记已学并尝试弹真相弹窗 */
async function openVideo(video: VideoItem) {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  window.open(video.videoUrl, '_blank');

  // 标记已学（不阻塞交互）。外链跳转场景拿不到 currentTime，
  // 不传 watchedSeconds；服务端按"看过（未必完成）"处理。
  courseApi
    .markWatched(video.id)
    .then((res) => {
      const target = course.value?.videos.find((v) => v.id === video.id);
      if (target) target.watched = true;
      if (course.value) {
        // 完成态以服务端判定为准：≥ 视频时长 × 90% 才计入 learnedCount
        // 当前未传 watchedSeconds，completed 总是 false；保留逻辑以便
        // 未来内嵌播放器接入时直接复用。
        void res;
        const learned = course.value.videos.filter((v) => v.watched).length;
        course.value.learnedCount = learned;
        course.value.progress = Math.round((learned / course.value.videos.length) * 100);
      }
    })
    .catch(() => {
      // 已提示
    });

  // 真相弹窗：接口 404 时不弹（请求已静默）
  try {
    const popup = await courseApi.getPopup(video.id);
    truthContent.value = popup.content;
    truthVisible.value = true;
  } catch {
    // 404：该视频暂无套路解析，不打扰用户
  }
}

onMounted(() => {
  load();
  loadQuiz();
});
</script>

<template>
  <van-nav-bar title="课程详情" left-arrow @click-left="router.back()" />

  <div class="page" v-if="loading">
    <van-skeleton title :row="10" />
  </div>

  <template v-else-if="course">
    <!-- 课程信息头部 -->
    <div class="course-head">
      <van-image
        :src="course.coverUrl"
        width="100%"
        height="160"
        fit="cover"
        radius="8"
        lazy-load
      >
        <template #error>📚</template>
      </van-image>
      <div class="course-head__body card">
        <div class="course-head__title">{{ course.title }}</div>
        <div class="course-head__meta">
          <span class="chip course-head__free" v-if="course.isFree">免费</span>
          <span class="chip course-head__cat">{{ categoryLabel }}</span>
          <span class="text-aux">{{ course.learnerCount }} 人在学</span>
        </div>
        <div class="course-head__desc">{{ course.description }}</div>
        <div class="course-head__disclaimer text-aux">{{ COURSE_DISCLAIMER }}</div>
      </div>
    </div>

    <!-- 课程画像 -->
    <div v-if="summary || outcomes.length || warningTips.length" class="card course-profile">
      <div v-if="summary" class="course-profile__summary">{{ summary }}</div>

      <div class="course-profile__chips">
        <span
          class="chip course-profile__chip"
          :style="{ background: difficultyColor + '22', color: difficultyColor }"
        >难度 · {{ difficultyLabel }}</span>
        <span class="chip course-profile__chip course-profile__chip--audience">
          适用 · {{ audienceLabel }}
        </span>
        <span class="chip course-profile__chip course-profile__chip--time">
          ⏱ 约 {{ estimated }} 分钟
        </span>
      </div>

      <div v-if="outcomes.length" class="course-profile__block">
        <div class="course-profile__title">学习目标</div>
        <ul class="course-profile__list course-profile__list--ok">
          <li v-for="(o, i) in outcomes" :key="`o-${i}`">{{ o }}</li>
        </ul>
      </div>

      <div v-if="warningTips.length" class="course-profile__block">
        <div class="course-profile__title course-profile__title--warn">警示要点</div>
        <ul class="course-profile__list course-profile__list--warn">
          <li v-for="(t, i) in warningTips" :key="`w-${i}`">{{ t }}</li>
        </ul>
      </div>
    </div>

    <!-- 视频列表 -->
    <div class="section-title">课程内容（{{ course.videos.length }} 节）</div>
    <div class="card">
      <div
        v-for="(video, i) in course.videos"
        :key="video.id"
        class="video-item pressable"
        @click="openVideo(video)"
      >
        <span class="video-item__index" :class="{ 'video-item__index--done': video.watched }">
          {{ video.watched ? '✓' : i + 1 }}
        </span>
        <div class="video-item__info">
          <div class="video-item__title" :class="{ 'video-item__title--done': video.watched }">
            {{ video.title }}
          </div>
          <div class="text-aux">{{ formatDuration(video.duration) }} · 跳转外部观看</div>
        </div>
        <van-icon name="play-circle-o" size="20" color="#4CAF50" />
      </div>
      <div v-if="!course.videos.length" class="text-aux" style="text-align: center; padding: 16px 0">
        视频内容准备中
      </div>
    </div>

    <!-- 收益预期校准测试 -->
    <div class="section-title">收益预期校准测试</div>
    <div v-if="quizLoading">
      <van-skeleton :row="4" />
    </div>
    <template v-else>
      <QuizCard
        v-for="(q, i) in quizzes"
        :key="q.id"
        :question="q"
        :index="i + 1"
      />
      <div v-if="!quizzes.length" class="card text-aux" style="text-align: center">
        本课程暂无测试题，先去学习课程内容吧
      </div>
    </template>

    <div class="course-foot text-aux">{{ COURSE_DISCLAIMER }} 请理性学习，不轻信任何收益承诺。</div>

    <!-- 真相弹窗 -->
    <TruthPopup v-model:show="truthVisible" :content="truthContent" />
  </template>
</template>

<style scoped>
.course-head__body {
  margin-top: -12px;
  position: relative;
  z-index: 1;
}

.course-head__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
  line-height: 1.4;
}

.course-head__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.course-head__free {
  background: var(--danger-bg);
  color: var(--danger);
}

.course-head__cat {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.course-head__desc {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.7;
  margin-bottom: 8px;
}

.course-head__disclaimer {
  background: var(--bg);
  border-radius: 6px;
  padding: 8px 10px;
}

.course-profile {
  margin-top: 12px;
}

.course-profile__summary {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.7;
  margin-bottom: 10px;
}

.course-profile__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.course-profile__chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg);
  color: var(--text-sub);
}

.course-profile__chip--audience {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.course-profile__chip--time {
  background: var(--bg);
  color: var(--text-sub);
}

.course-profile__block {
  margin-top: 8px;
}

.course-profile__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-profile__title--warn::before {
  content: '⚠️';
  font-size: 13px;
}

.course-profile__list {
  padding-left: 18px;
  margin: 0;
  list-style: none;
}

.course-profile__list li {
  position: relative;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-main);
  padding-left: 4px;
  margin-bottom: 2px;
}

.course-profile__list--ok li::before {
  content: '✓';
  position: absolute;
  left: -16px;
  color: var(--primary);
  font-weight: 700;
}

.course-profile__list--warn li::before {
  content: '✗';
  position: absolute;
  left: -16px;
  color: var(--danger);
  font-weight: 700;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.video-item:last-child {
  border-bottom: none;
}

.video-item__index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg);
  color: var(--text-sub);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.video-item__index--done {
  background: var(--primary);
  color: #fff;
}

.video-item__info {
  flex: 1;
  min-width: 0;
}

.video-item__title {
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-item__title--done {
  color: var(--text-sub);
  text-decoration: line-through;
}

.course-foot {
  text-align: center;
  padding: 16px 8px 8px;
}
</style>
