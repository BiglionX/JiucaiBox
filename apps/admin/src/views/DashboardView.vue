<template>
  <div v-if="data" class="dashboard">
    <!-- 今日关键数据 -->
    <a-row :gutter="[16, 16]">
      <a-col v-for="card in statCards" :key="card.title" :xs="24" :sm="12" :lg="6">
        <a-card hoverable class="stat-card" @click="router.push(card.to)">
          <a-statistic
            :title="card.title"
            :value="card.value"
            :value-style="{ color: card.color }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="row-gap">
      <!-- 风险等级分布（近 7 天） -->
      <a-col :xs="24" :lg="14">
        <a-card title="风险等级分布（近 7 天）">
          <a-spin :spinning="loading">
            <div v-if="riskTotal === 0" class="empty-tip">近 7 天暂无已评级的测评报告</div>
            <div v-else class="risk-bars">
              <div v-for="level in riskLevels" :key="level" class="risk-row">
                <span class="risk-label" :style="{ color: RISK_LEVEL_META[level].color }">
                  {{ RISK_LEVEL_META[level].label }}
                </span>
                <a-progress
                  class="risk-progress"
                  :percent="riskPercent(level)"
                  :stroke-color="RISK_LEVEL_META[level].color"
                  :format="() => `${riskCount(level)} 条`"
                />
              </div>
            </div>
          </a-spin>
        </a-card>
      </a-col>

      <!-- 待复核测评 -->
      <a-col :xs="24" :lg="10">
        <a-card hoverable class="review-card" @click="router.push('/analysis')">
          <div class="review-inner">
            <div class="review-text">
              <div class="review-title">待复核测评</div>
              <div class="review-desc">已完成但尚未人工复核的报告</div>
            </div>
            <div class="review-value">{{ data.pendingReviews }}</div>
          </div>
          <div class="review-action">前往复核 →</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近待审故事 -->
    <a-card title="最近待审核故事" class="row-gap">
      <a-table
        :data-source="data.recentStories"
        :columns="storyColumns"
        :pagination="false"
        :loading="loading"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <span class="story-title">{{ record.title }}</span>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="goStories">去审核</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { RISK_LEVEL_META, RISK_LEVELS, type DashboardData, type RiskLevel } from '@jiucaibox/shared';
import { fetchDashboard } from '@/api';
import { formatDateTime } from '@/utils/format';

const router = useRouter();
const data = ref<DashboardData | null>(null);
const loading = ref(false);

const riskLevels = [...RISK_LEVELS] as RiskLevel[];

async function load() {
  loading.value = true;
  try {
    data.value = await fetchDashboard();
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const statCards = computed(() => {
  const today = data.value?.today;
  return [
    { title: '今日新增用户', value: today?.newUsers ?? 0, to: '/users', color: '#1677ff' },
    { title: '今日测评提交', value: today?.analysisCount ?? 0, to: '/analysis', color: '#722ed1' },
    { title: '待审核故事', value: today?.pendingStories ?? 0, to: '/stories', color: '#fa8c16' },
    { title: '今日完课数', value: today?.completedVideos ?? 0, to: '/stats', color: '#52c41a' },
  ];
});

const riskTotal = computed(() =>
  (data.value?.riskDistribution ?? []).reduce((sum, r) => sum + r.count, 0),
);

function riskCount(level: RiskLevel): number {
  return data.value?.riskDistribution.find((r) => r.level === level)?.count ?? 0;
}

function riskPercent(level: RiskLevel): number {
  if (riskTotal.value <= 0) return 0;
  return Math.round((riskCount(level) / riskTotal.value) * 100);
}

function goStories() {
  router.push('/stories');
}

const storyColumns = [
  { title: '标题', key: 'title', ellipsis: true },
  { title: '匿名昵称', dataIndex: 'userNickname', width: 140 },
  { title: '提交时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 90 },
];
</script>

<style scoped>
.stat-card {
  cursor: pointer;
}
.row-gap {
  margin-top: 16px;
}
.risk-bars {
  padding: 8px 8px 0;
}
.risk-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.risk-label {
  width: 64px;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}
.risk-progress {
  flex: 1;
}
.empty-tip {
  padding: 32px 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.35);
}
.review-card {
  cursor: pointer;
  height: 100%;
}
.review-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.review-title {
  font-size: 16px;
  font-weight: 600;
}
.review-desc {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.review-value {
  font-size: 40px;
  font-weight: 700;
  color: #fa8c16;
}
.review-action {
  margin-top: 12px;
  font-size: 13px;
  color: #1677ff;
}
.story-title {
  color: rgba(0, 0, 0, 0.88);
}
</style>
