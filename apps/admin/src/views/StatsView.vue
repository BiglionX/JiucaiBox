<template>
  <div v-if="data" class="stats-page">
    <!-- 7 天趋势 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="8">
        <a-card title="用户增长趋势（近 7 天）">
          <TrendChart :data="data.userGrowth" color="#1677ff" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="测评提交趋势（近 7 天）">
          <TrendChart :data="data.analysisTrend" color="#722ed1" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="故事发布趋势（近 7 天）">
          <TrendChart :data="data.storyTrend" color="#52c41a" />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="row-gap">
      <!-- 风险等级占比 -->
      <a-col :xs="24" :lg="10">
        <a-card title="风险等级占比">
          <div v-if="riskTotal === 0" class="empty-tip">暂无已评级的测评报告</div>
          <div v-else class="ratio-bars">
            <div v-for="level in riskLevels" :key="level" class="ratio-row">
              <span class="ratio-label" :style="{ color: RISK_LEVEL_META[level].color }">
                {{ RISK_LEVEL_META[level].label }}
              </span>
              <a-progress
                class="ratio-progress"
                :percent="ratioPercent(level)"
                :stroke-color="RISK_LEVEL_META[level].color"
                :format="() => `${ratioCount(level)} 条（${ratioPercent(level)}%）`"
              />
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 最常见风险类型 top5 -->
      <a-col :xs="24" :lg="14">
        <a-card title="最常见风险类型 TOP 5">
          <div v-if="!data.topRiskTypes.length" class="empty-tip">暂无风险类型数据</div>
          <div v-else>
            <div v-for="(item, index) in data.topRiskTypes" :key="item.type" class="top-row">
              <span class="top-index">{{ index + 1 }}</span>
              <span class="top-type">{{ item.type }}</span>
              <div class="top-track">
                <div
                  class="top-fill"
                  :style="{ width: topPercent(item.count) + '%' }"
                ></div>
              </div>
              <span class="top-count">{{ item.count }} 次</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 课程完课率 -->
    <a-card title="课程完课率" class="row-gap">
      <div v-if="!data.courseCompletion.length" class="empty-tip">暂无课程数据</div>
      <div v-else class="completion-list">
        <div v-for="item in data.courseCompletion" :key="item.title" class="completion-row">
          <a-tooltip :title="item.title">
            <span class="completion-title">{{ item.title }}</span>
          </a-tooltip>
          <a-progress
            class="completion-progress"
            :percent="item.completionRate"
            :status="item.completionRate === 100 ? 'success' : 'active'"
          />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RISK_LEVEL_META, RISK_LEVELS, type RiskLevel, type StatsOverview } from '@jiucaibox/shared';
import { fetchStatsOverview } from '@/api';
import TrendChart from '@/components/TrendChart.vue';

const data = ref<StatsOverview | null>(null);

const riskLevels = [...RISK_LEVELS] as RiskLevel[];

async function load() {
  data.value = await fetchStatsOverview();
}
onMounted(load);

const riskTotal = computed(() => (data.value?.riskRatio ?? []).reduce((s, r) => s + r.count, 0));

function ratioCount(level: RiskLevel): number {
  return data.value?.riskRatio.find((r) => r.level === level)?.count ?? 0;
}

function ratioPercent(level: RiskLevel): number {
  if (riskTotal.value <= 0) return 0;
  return Math.round((ratioCount(level) / riskTotal.value) * 100);
}

const maxTop = computed(() =>
  Math.max(1, ...(data.value?.topRiskTypes ?? []).map((t) => t.count)),
);

function topPercent(count: number): number {
  return Math.round((count / maxTop.value) * 100);
}
</script>

<style scoped>
.row-gap {
  margin-top: 16px;
}
.ratio-bars {
  padding: 8px 8px 0;
}
.ratio-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.ratio-label {
  width: 64px;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}
.ratio-progress {
  flex: 1;
}
.empty-tip {
  padding: 32px 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.35);
}
.top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.top-index {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.top-type {
  width: 160px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}
.top-track {
  flex: 1;
  height: 12px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  overflow: hidden;
}
.top-fill {
  height: 100%;
  background: linear-gradient(90deg, #fa8c16, #f5222d);
  border-radius: 6px;
  transition: width 0.3s ease;
}
.top-count {
  width: 80px;
  text-align: right;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  flex-shrink: 0;
}
.completion-list {
  padding: 4px 8px;
}
.completion-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.completion-title {
  width: 220px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.75);
}
.completion-progress {
  flex: 1;
}
</style>
