<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { LIMITS } from '@jiucaibox/shared';
import type { AnalysisReport, SourceType } from '@jiucaibox/shared';
import { RISK_STATUS_LABELS } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import RiskTag from '@/components/RiskTag.vue';
import { useAnalysisStore } from '@/stores/analysis';
import { extractDomain, formatDateTime } from '@/utils/format';

const router = useRouter();
const analysisStore = useAnalysisStore();

const sourceUrl = ref('');
const inputText = ref('');
const submitting = ref(false);
const refreshing = ref(false);
const sourceType = ref<SourceType>('video');

const canSubmit = ref(false);

function onInput() {
  canSubmit.value = Boolean(sourceUrl.value.trim() || inputText.value.trim());
}

async function submit() {
  if (!canSubmit.value) {
    showToast('请粘贴课程链接或文案内容');
    return;
  }
  submitting.value = true;
  try {
    const id = await analysisStore.submit(
      sourceUrl.value.trim(),
      inputText.value.trim().slice(0, LIMITS.analysisInputMax),
      sourceType.value,
    );
    showToast('分析已提交，正在生成报告');
    router.push(`/analysis/result/${id}`);
  } catch {
    // 已提示
  } finally {
    submitting.value = false;
  }
}

function goReport(report: AnalysisReport) {
  router.push(`/analysis/result/${report.id}`);
}

async function loadHistory() {
  try {
    await analysisStore.fetchHistory();
  } catch {
    // 未登录或失败时静默
  }
}

function onRefresh() {
  loadHistory().finally(() => (refreshing.value = false));
}

onMounted(loadHistory);
</script>

<template>
  <div class="page">
    <!-- 顶部说明卡 -->
    <div class="card analysis-intro">
      <div class="analysis-intro__title">
        <van-icon name="search" color="#FF9800" size="18" />
        反割测评
      </div>
      <div class="analysis-intro__desc">
        AI 分析 + 人工经验，结果仅供参考。把你收到的课程链接或话术文案发给我们，帮你看看有哪些风险信号。
      </div>
    </div>

    <!-- 提交区 -->
    <div class="card">
      <van-field
        v-model="sourceUrl"
        label="链接"
        placeholder="粘贴课程/直播/加盟链接（可选）"
        clearable
        :border="false"
        @update:model-value="onInput"
      />
      <van-field
        v-model="inputText"
        type="textarea"
        rows="4"
        autosize
        label="文案"
        :maxlength="LIMITS.analysisInputMax"
        show-word-limit
        placeholder="粘贴对方发给你的话术文案（可选）"
        :border="false"
        @update:model-value="onInput"
      />
      <div class="analysis-source-type">
        <span class="text-aux">来源类型：</span>
        <van-radio-group v-model="sourceType" direction="horizontal">
          <van-radio name="video">视频</van-radio>
          <van-radio name="article">文章</van-radio>
          <van-radio name="other">其他</van-radio>
        </van-radio-group>
      </div>
      <van-button
        block
        round
        type="primary"
        class="analysis-submit"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="submit"
      >
        开始分析
      </van-button>
      <div class="text-aux mt8">链接与文案二选一即可，链接优先。请勿提交含个人隐私的内容。</div>
    </div>

    <!-- 历史报告 -->
    <div class="section-title">
      <span>历史报告</span>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <template v-if="analysisStore.history.length">
        <div
          v-for="report in analysisStore.history"
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
        </div>
      </template>

      <EmptyState
        v-else-if="!analysisStore.loadingHistory"
        text="还没有测评记录"
        description="把你的课程链接发给我，帮你看看风险"
      />
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.analysis-intro__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.analysis-intro__desc {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.7;
}

.analysis-source-type {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0 12px;
}

.analysis-submit {
  margin-top: 4px;
}

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
</style>
