<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DISCLAIMER } from '@jiucaibox/shared';
import type { AnalysisReport } from '@jiucaibox/shared';
import EmptyState from '@/components/EmptyState.vue';
import RiskRadar from '@/components/RiskRadar.vue';
import RiskTag from '@/components/RiskTag.vue';
import { useAnalysisStore } from '@/stores/analysis';
import { extractDomain, formatDateTime } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const analysisStore = useAnalysisStore();

const report = ref<AnalysisReport | null>(null);
const loading = ref(true);
const expanded = ref<number | null>(null);

const POLL_INTERVAL = 2000;
const MAX_POLL = 10;
let pollCount = 0;
let pollTimer: number | undefined;

async function load(initial = false) {
  if (initial) loading.value = true;
  try {
    const id = route.params.id as string;
    report.value = await analysisStore.getById(id);
    if (report.value.status === 'pending') {
      startPolling();
    }
  } catch {
    // 已提示
  } finally {
    if (initial) loading.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(async () => {
    pollCount += 1;
    if (pollCount > MAX_POLL) {
      stopPolling();
      return;
    }
    await load();
    if (report.value?.status !== 'pending') {
      stopPolling();
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

function toggleExpand(i: number) {
  expanded.value = expanded.value === i ? null : i;
}

function goDeep() {
  if (!report.value) return;
  router.push(`/analysis/deep/${report.value.id}`);
}

function retry() {
  router.replace('/analysis');
}

onMounted(() => load(true));
onBeforeUnmount(stopPolling);

const domain = computed(() => (report.value ? extractDomain(report.value.sourceUrl) : ''));
</script>

<template>
  <van-nav-bar title="测评报告" left-arrow @click-left="router.back()" />

  <div class="page" v-if="loading">
    <van-skeleton title :row="8" />
  </div>

  <div class="page" v-else-if="report">
    <!-- 分析中 -->
    <div v-if="report.status === 'pending'" class="card analysis-pending">
      <van-loading color="#4CAF50" />
      <div class="analysis-pending__title">正在分析中…</div>
      <div class="text-aux">AI 正在逐条比对风险信号，通常需要 10-30 秒，请稍候</div>
    </div>

    <!-- 失败 -->
    <div v-else-if="report.status === 'failed'" class="card analysis-failed">
      <van-icon name="fail" size="40" color="#F44336" />
      <div class="analysis-failed__title">分析失败了</div>
      <div class="text-aux mb16">{{ report.failReason || '可能链接无效或内容过短' }}</div>
      <van-button round type="primary" size="small" @click="retry">重新提交</van-button>
    </div>

    <!-- 完成 -->
    <template v-else>
      <!-- 风险等级头部 -->
      <div class="card result-head">
        <RiskTag :level="report.riskLevel" size="lg" />
        <div class="result-head__source">{{ domain || '未知来源' }}</div>
        <div class="text-aux">{{ formatDateTime(report.createdAt) }}</div>
        <div class="result-head__tip" v-if="report.riskLevel === 'high'">
          该内容风险较高，建议先冷静，不要急于付费。
        </div>
      </div>

      <!-- 风险雷达 -->
      <div class="card">
        <div class="result-section-title">风险维度</div>
        <RiskRadar :dimensions="report.dimensions" :level="report.riskLevel" />
      </div>

      <!-- 风险点列表 -->
      <div class="card" v-if="report.riskPoints.length">
        <div class="result-section-title">发现的风险点</div>
        <div
          v-for="(point, i) in report.riskPoints"
          :key="point.type + i"
          class="risk-point pressable"
          @click="toggleExpand(i)"
        >
          <div class="risk-point__head">
            <van-icon name="warning-o" color="#FF9800" size="16" />
            <span class="risk-point__type">{{ point.type }}</span>
            <span class="risk-point__count">出现 {{ point.count }} 次</span>
            <van-icon :name="expanded === i ? 'arrow-up' : 'arrow-down'" size="14" color="#757575" />
          </div>
          <div v-if="expanded === i" class="risk-point__evidence">“{{ point.evidence }}”</div>
        </div>
      </div>

      <!-- 综合建议 -->
      <div class="card">
        <div class="result-section-title">综合建议</div>
        <div class="result-analysis">{{ report.analysis }}</div>
        <div class="quote-block" v-if="report.recommendation">{{ report.recommendation }}</div>
      </div>

      <!-- 深度接洽入口 -->
      <van-button block round type="primary" class="deep-entry" @click="goDeep">
        我想进一步接触，帮我避坑
      </van-button>
      <div class="text-aux deep-entry__tip">
        进入深度接洽流程，在沟通中一步步识别对方的套路
      </div>
    </template>

    <!-- 底部免责声明 -->
    <div class="result-disclaimer text-aux">{{ DISCLAIMER }}</div>
  </div>

  <div class="page" v-else>
    <EmptyState text="报告不存在或已失效" description="请返回测评中心重新提交">
      <template #action>
        <van-button round type="primary" size="small" @click="router.replace('/analysis')">
          去测评
        </van-button>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.analysis-pending {
  text-align: center;
  padding: 48px 16px;
}

.analysis-pending__title {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 6px;
  color: var(--text-main);
}

.analysis-failed {
  text-align: center;
  padding: 40px 16px;
}

.analysis-failed__title {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 6px;
  color: var(--text-main);
}

.result-head {
  text-align: center;
}

.result-head__source {
  font-size: 14px;
  color: var(--text-main);
  margin-top: 10px;
}

.result-head__tip {
  margin-top: 8px;
  font-size: 13px;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 6px;
  padding: 8px 10px;
}

.result-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 12px;
}

.risk-point {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.risk-point:last-child {
  border-bottom: none;
}

.risk-point__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.risk-point__type {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
}

.risk-point__count {
  font-size: 12px;
  color: var(--text-sub);
  margin-right: 4px;
}

.risk-point__evidence {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-sub);
  background: var(--bg);
  border-radius: 6px;
  padding: 10px 12px;
  line-height: 1.7;
}

.result-analysis {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.8;
}

.deep-entry {
  margin-top: 8px;
}

.deep-entry__tip {
  text-align: center;
  margin: 8px 0 4px;
}

.result-disclaimer {
  text-align: center;
  padding: 16px 8px 8px;
}
</style>
