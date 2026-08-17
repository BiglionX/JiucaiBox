<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { LearningRecord } from '@jiucaibox/shared';
import { userApi, type UserLearningData } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import { formatDateTime, formatDuration } from '@/utils/format';

const router = useRouter();

const data = ref<UserLearningData | null>(null);
const loading = ref(true);

const recent = ref<LearningRecord[]>([]);

async function load() {
  loading.value = true;
  try {
    data.value = await userApi.getLearning();
    recent.value = data.value.records.slice(0, 3);
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

function goCourse(id: number) {
  router.push(`/course/${id}`);
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="学习记录" left-arrow @click-left="router.back()" />

  <div class="page" v-if="loading">
    <van-skeleton title :row="8" />
  </div>

  <template v-else-if="data">
    <!-- 统计卡片 -->
    <div class="card learning-stats">
      <div class="learning-stat">
        <div class="learning-stat__num">{{ data.stats.courseCount }}</div>
        <div class="text-aux">累计课程</div>
      </div>
      <div class="learning-stat">
        <div class="learning-stat__num">{{ data.stats.videoCount }}</div>
        <div class="text-aux">累计视频</div>
      </div>
      <div class="learning-stat">
        <div class="learning-stat__num">{{ formatDuration(data.stats.totalSeconds) }}</div>
        <div class="text-aux">累计时长</div>
      </div>
    </div>

    <!-- 最近学习 -->
    <div class="section-title">最近学习</div>
    <div v-if="recent.length">
      <div
        v-for="record in recent"
        :key="record.courseId"
        class="card learning-item pressable"
        @click="goCourse(record.courseId)"
      >
        <van-image :src="record.coverUrl" width="72" height="56" fit="cover" radius="6" lazy-load>
          <template #error>📚</template>
        </van-image>
        <div class="learning-item__info">
          <div class="learning-item__title">{{ record.courseTitle }}</div>
          <div class="text-aux">{{ formatDateTime(record.updatedAt) }} 学习</div>
          <van-progress
            :percentage="record.progress"
            :show-pivot="false"
            stroke-width="4"
            color="#4CAF50"
          />
        </div>
      </div>
    </div>
    <EmptyState v-else text="还没有学习记录" description="去真相课看看，免费学习防割知识" />

    <!-- 我的课程 -->
    <div class="section-title">我的课程</div>
    <div v-if="data.records.length">
      <div
        v-for="record in data.records"
        :key="record.courseId"
        class="card learning-item pressable"
        @click="goCourse(record.courseId)"
      >
        <van-image :src="record.coverUrl" width="72" height="56" fit="cover" radius="6" lazy-load>
          <template #error>📚</template>
        </van-image>
        <div class="learning-item__info">
          <div class="learning-item__title">{{ record.courseTitle }}</div>
          <div class="text-aux">
            已学 {{ record.learnedCount }}/{{ record.totalCount }} 节
          </div>
          <van-progress
            :percentage="record.progress"
            :show-pivot="false"
            stroke-width="4"
            color="#4CAF50"
          />
        </div>
        <van-button size="mini" round type="primary" plain>继续学习</van-button>
      </div>
    </div>
    <EmptyState v-else text="还没有开始学习任何课程" description="点击右上角去选课吧" />
  </template>
</template>

<style scoped>
.learning-stats {
  display: flex;
  padding: 20px 8px;
}

.learning-stat {
  flex: 1;
  text-align: center;
}

.learning-stat__num {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 2px;
}

.learning-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.learning-item__info {
  flex: 1;
  min-width: 0;
}

.learning-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.learning-item__info .van-progress {
  margin-top: 4px;
}
</style>
