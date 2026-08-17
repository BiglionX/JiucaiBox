<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { BRAND, COURSE_CATEGORY_LABELS } from '@jiucaibox/shared';
import type { CourseItem, HomeData, StoryItem } from '@jiucaibox/shared';
import { homeApi } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import StoryCard from '@/components/StoryCard.vue';
import { timeAgo } from '@/utils/format';

const router = useRouter();

const home = ref<HomeData>({
  banner: null,
  featuredCourses: [],
  latestStories: [],
  latestRadio: null,
});
const loading = ref(false);
const refreshing = ref(false);

const banner = computed(() => home.value.banner);
const latestRadio = computed(() => home.value.latestRadio);

async function load() {
  if (loading.value) return;
  loading.value = true;
  try {
    home.value = await homeApi.getHome();
  } catch {
    // 已提示；保留旧数据
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function goCourse(course: CourseItem) {
  router.push(`/course/${course.id}`);
}

function goStory(story: StoryItem) {
  router.push(`/stories/${story.id}`);
}

function onBannerClick() {
  router.push(banner.value?.url || '/radio/1');
}

function goCoursesByCategory(category: keyof typeof COURSE_CATEGORY_LABELS | undefined) {
  router.push({ path: '/courses', query: category ? { category } : {} });
}

onMounted(load);
</script>

<template>
  <div class="page home-page">
    <!-- 顶部：Logo + 标语 -->
    <div class="home-header">
      <div class="home-header__logo">
        <span class="home-header__shield">🛡️</span>
        <span class="home-header__name">{{ BRAND.name }}</span>
      </div>
      <div class="home-header__slogan">{{ BRAND.slogan }}</div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="load">
      <!-- 紧急预警横幅 -->
      <div v-if="banner" class="home-banner pressable" @click="onBannerClick">
        <van-icon name="warning-o" size="18" />
        <span class="home-banner__text">{{ banner.title }}</span>
        <van-icon name="arrow" size="14" />
      </div>

      <!-- 4 宫格快捷入口 -->
      <div class="home-grid card">
        <div class="home-grid__item pressable" @click="router.push('/analysis')">
          <span class="home-grid__icon" style="background: #fff3e0; color: #ff9800">
            <van-icon name="search" size="22" />
          </span>
          <span class="home-grid__label">反割测评</span>
        </div>
        <div class="home-grid__item pressable" @click="router.push('/courses')">
          <span class="home-grid__icon" style="background: #e8f5e9; color: #4caf50">
            <van-icon name="play-circle-o" size="22" />
          </span>
          <span class="home-grid__label">真相课</span>
        </div>
        <div class="home-grid__item pressable" @click="goCoursesByCategory('experience')">
          <span class="home-grid__icon" style="background: #e3f2fd; color: #2196f3">
            <van-icon name="shield-o" size="22" />
          </span>
          <span class="home-grid__label">韭菜体验营</span>
        </div>
        <div class="home-grid__item pressable" @click="router.push('/radio')">
          <span class="home-grid__icon" style="background: #fdecea; color: #f44336">
            <van-icon name="volume-o" size="22" />
          </span>
          <span class="home-grid__label">韭菜电台</span>
        </div>
      </div>

      <!-- 推荐课程（横滑） -->
      <div class="section-title">
        <span>推荐课程</span>
        <span class="more" @click="router.push('/courses')">查看全部 ›</span>
      </div>
      <div v-if="home.featuredCourses.length" class="home-courses">
        <div
          v-for="course in home.featuredCourses"
          :key="course.id"
          class="home-course pressable"
          @click="goCourse(course)"
        >
          <van-image
            :src="course.coverUrl"
            fit="cover"
            width="100%"
            height="90"
            radius="8"
            lazy-load
          >
            <template #error>📚</template>
          </van-image>
          <div class="home-course__free" v-if="course.isFree">免费</div>
          <div class="home-course__title">{{ course.title }}</div>
          <div class="home-course__meta">{{ COURSE_CATEGORY_LABELS[course.category] ?? '课程' }} · {{ course.videoCount ?? 0 }} 节</div>
        </div>
      </div>
      <div v-else class="card text-aux" style="text-align: center">课程内容准备中，敬请期待</div>

      <!-- 最新泪花 -->
      <div class="section-title">
        <span>最新泪花</span>
        <span class="more" @click="router.push('/stories')">更多 ›</span>
      </div>
      <template v-if="home.latestStories.length">
        <StoryCard
          v-for="story in home.latestStories"
          :key="story.id"
          :story="story"
          @click="goStory"
        />
      </template>
      <EmptyState
        v-else
        text="还没有泪花，来说出你的经历"
        description="你的分享，可能照亮别人回家的路"
      />

      <!-- 电台速报 -->
      <div class="section-title">
        <span>韭菜电台</span>
        <span class="more" @click="router.push('/radio')">更多 ›</span>
      </div>
      <div
        v-if="latestRadio"
        class="card radio-latest pressable"
        @click="router.push(`/radio/${latestRadio.id}`)"
      >
        <div class="radio-latest__head">
          <span class="radio-latest__tag">最新速报</span>
          <span class="text-aux">{{ timeAgo(latestRadio.createdAt) }}</span>
        </div>
        <div class="radio-latest__title">{{ latestRadio.title }}</div>
        <div class="radio-latest__summary">{{ latestRadio.summary }}</div>
      </div>
      <div v-else class="card text-aux" style="text-align: center">电台内容准备中</div>

      <div class="home-footer text-aux">
        公益教育平台 · 结果仅供参考，不构成任何投资建议
      </div>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.home-page {
  padding-top: 12px;
}

.home-header {
  padding: 8px 4px 16px;
}

.home-header__logo {
  display: flex;
  align-items: center;
}

.home-header__shield {
  font-size: 26px;
  margin-right: 8px;
}

.home-header__name {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-dark);
  letter-spacing: 1px;
}

.home-header__slogan {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-sub);
}

.home-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--danger);
  color: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
  font-size: 13px;
}

.home-banner__text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 16px 8px;
}

.home-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.home-grid__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-grid__label {
  font-size: 12px;
  color: var(--text-main);
}

.home-courses {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.home-courses::-webkit-scrollbar {
  display: none;
}

.home-course {
  width: 140px;
  flex-shrink: 0;
  background: var(--card);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  padding-bottom: 10px;
}

.home-course__free {
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}

.home-course__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 8px 10px 2px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-course__meta {
  font-size: 12px;
  color: var(--text-sub);
  margin: 0 10px;
}

.radio-latest__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.radio-latest__tag {
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 4px;
}

.radio-latest__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.radio-latest__summary {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-footer {
  text-align: center;
  padding: 20px 0 8px;
}
</style>
