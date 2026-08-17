/**
 * 测评状态：历史报告列表、当前报告、提交与深度反馈
 */
import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { AnalysisReport, DeepFeedbackItem, SourceType } from '@jiucaibox/shared';
import { analysisApi, userApi, type DeepResult } from '@/api';
import { useUserStore } from '@/stores/user';

export const useAnalysisStore = defineStore('analysis', () => {
  const history = ref<AnalysisReport[]>([]);
  const current = ref<AnalysisReport | null>(null);
  const submitting = ref(false);
  const loadingHistory = ref(false);

  /** 拉取当前用户的历史报告（未登录时静默清空） */
  async function fetchHistory() {
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      history.value = [];
      return;
    }
    loadingHistory.value = true;
    try {
      const res = await userApi.getMyAnalysis({ page: 1, pageSize: 20 });
      history.value = res.list;
    } finally {
      loadingHistory.value = false;
    }
  }

  /** 提交测评，返回报告 id */
  async function submit(
    sourceUrl: string,
    inputText: string,
    sourceType: SourceType,
  ): Promise<number> {
    submitting.value = true;
    try {
      const report = await analysisApi.create({
        sourceUrl: sourceUrl || undefined,
        inputText: inputText || undefined,
        sourceType,
      });
      current.value = report;
      history.value = [report, ...history.value];
      return report.id;
    } finally {
      submitting.value = false;
    }
  }

  async function getById(id: number | string): Promise<AnalysisReport> {
    if (current.value?.id === Number(id)) return current.value;
    const report = await analysisApi.getById(id);
    current.value = report;
    return report;
  }

  /** 提交深度接洽反馈，返回带 deepRiskLevel 的结果 */
  async function deepFeedback(
    id: number | string,
    feedback: DeepFeedbackItem[],
  ): Promise<DeepResult> {
    const result = await analysisApi.submitDeepFeedback(id, feedback);
    if (current.value?.id === Number(id)) {
      current.value = { ...current.value, ...result };
    }
    return result;
  }

  function clear() {
    history.value = [];
    current.value = null;
  }

  return {
    history,
    current,
    submitting,
    loadingHistory,
    fetchHistory,
    submit,
    getById,
    deepFeedback,
    clear,
  };
});
