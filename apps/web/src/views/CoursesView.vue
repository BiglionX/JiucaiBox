<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { COURSE_CATEGORY_LABELS } from '@jiucaibox/shared';
import type { CourseCategory } from '@jiucaibox/shared';
import EmptyState from '@/components/EmptyState.vue';
import { useCourseStore } from '@/stores/course';

const router = useRouter();
const route = useRoute();
const courseStore = useCourseStore();

type CategoryFilter = CourseCategory | 'all';

const tabs = ref<{ label: string; value: CategoryFilter }[]>([
  { label: '全部', value: 'all' },
  ...(Object.keys(COURSE_CATEGORY_LABELS) as CourseCategory[]).map((c) => ({
    label: COURSE_CATEGORY_LABELS[c],
    value: c as CategoryFilter,
  })),
]);

const active = ref<CategoryFilter>(
  (route.query.category as CategoryFilter) || 'all',
);

watch(active, (val) => {
  courseStore.fetchCourses(val);
});

// 支持从首页入口（带 query.category）导航进入时同步筛选
watch(
  () => route.query.category,
  (val) => {
    const next = (val as CategoryFilter) || 'all';
    if (next !== active.value) active.value = next;
  },
);

function goDetail(id: number) {
  router.push(`/course/${id}`);
}

function onRefresh() {
  courseStore.fetchCourses(active.value).finally(() => {
    // van-pull-refresh 自动复位
  });
}

function onLoad() {
  if (courseStore.finished) return;
  courseStore.fetchCourses(active.value, true);
}

onMounted(() => {
  courseStore.fetchCourses(active.value);
});
</script>

<template>
  <van-nav-bar title="真相课" />

  <div class="courses-page">
    <van-tabs v-model:active="active" sticky :swipeable="true" color="#4CAF50">
      <van-tab
        v-for="tab in tabs"
        :key="tab.value"
        :title="tab.label"
        :name="tab.value"
      />
    </van-tabs>

    <div class="page">
      <van-pull-refresh v-model="courseStore.loading" @refresh="onRefresh">
        <van-list
          v-model:loading="courseStore.loading"
          :finished="courseStore.finished"
          finished-text="没有更多课程了"
          @load="onLoad"
        >
          <div
            v-for="course in courseStore.courses"
            :key="course.id"
            class="card course-item pressable"
            @click="goDetail(course.id)"
          >
            <div class="course-item__body">
              <van-image
                :src="course.coverUrl"
                width="92"
                height="72"
                fit="cover"
                radius="8"
                lazy-load
              >
                <template #error>📚</template>
              </van-image>
              <div class="course-item__info">
                <div class="course-item__title">{{ course.title }}</div>
                <div class="course-item__desc">{{ course.description }}</div>
                <div class="course-item__meta">
                  <span v-if="course.isFree" class="chip course-item__free">免费</span>
                  <span class="text-aux">共 {{ course.videoCount ?? 0 }} 节</span>
                </div>
              </div>
            </div>
            <div
              v-if="course.progress !== undefined && course.progress > 0"
              class="course-item__progress"
            >
              <van-progress
                :percentage="course.progress"
                :show-pivot="false"
                stroke-width="5"
                color="#4CAF50"
              />
              <span class="text-aux course-item__progress-text">
                已学 {{ course.learnedCount ?? 0 }}/{{ course.videoCount ?? 0 }} 节
              </span>
            </div>
          </div>
        </van-list>

        <EmptyState
          v-if="!courseStore.courses.length && !courseStore.loading"
          text="这个分类下还没有课程"
          description="我们正在努力准备防割内容"
        />
      </van-pull-refresh>
    </div>
  </div>
</template>

<style scoped>
.courses-page {
  min-height: 100vh;
}

.course-item__body {
  display: flex;
  gap: 12px;
}

.course-item__info {
  flex: 1;
  min-width: 0;
}

.course-item__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
  line-height: 1.4;
}

.course-item__desc {
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-item__free {
  background: var(--danger-bg);
  color: var(--danger);
}

.course-item__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.course-item__progress .van-progress {
  flex: 1;
}

.course-item__progress-text {
  white-space: nowrap;
}
</style>
