<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { AnalysisReport } from '@jiucaibox/shared';
import { userApi, RISK_STATUS_LABELS } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import RiskTag from '@/components/RiskTag.vue';
import { extractDomain, formatDateTime } from '@/utils/format';

const router = useRouter();

const list = ref<AnalysisReport[]>([]);
const loading = ref(false);
const finished = ref(false);
const page = ref(1);

async function load(append = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await userApi.getMyAnalysis({ page: page.value, pageSize: 10 });
    list.value = append ? [...list.value, ...res.list] : res.list;
    finished.value = list.value.length >= res.total;
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

function onLoad() {
  if (finished.value) return;
  page.value += 1;
  load(true);
}

function goReport(report: AnalysisReport) {
  router.push(`/analysis/result/${report.id}`);
}

onMounted(() => load());
</script>

<template>
  <van-nav-bar title="我的测评" left-arrow @click-left="router.back()" />

  <div class="page">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <div
        v-for="report in list"
        :key="report.id"
        class="card report-item pressable"
        @click="goReport(report)"
      >
        <div class="report-item__top">
          <div class="report-item__title">
            {{ extractDomain(report.sourceUrl) || report.sourceType || '未知来源' }}
          </div>
          <RiskTag :level="report.riskLevel" />
        </div>
        <div class="report-item__meta">
          <span class="text-aux">{{ formatDateTime(report.createdAt) }}</span>
          <span
            class="report-item__status"
            :class="{ 'report-item__status--pending': report.status === 'pending' }"
          >
            {{ RISK_STATUS_LABELS[report.status] }}
          </span>
        </div>
        <div v-if="report.status === 'failed'" class="report-item__fail text-aux">
          {{ report.failReason || '分析失败，可重新提交' }}
        </div>
      </div>
    </van-list>

    <EmptyState
      v-if="!list.length && !loading"
      text="还没有测评记录"
      description="去测一测你感兴趣的课程吧"
    >
      <template #action>
        <van-button round type="primary" size="small" @click="router.push('/analysis')">
          去测评
        </van-button>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.report-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.report-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-item__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-item__status {
  font-size: 12px;
  color: var(--primary-dark);
}

.report-item__status--pending {
  color: var(--warning);
}

.report-item__fail {
  margin-top: 6px;
}
</style>
