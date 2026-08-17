<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { DEEP_STEPS, DEEP_STEP_COUNT, RISK_LEVEL_META } from '@jiucaibox/shared';
import type { DeepFeedbackItem, RiskLevel } from '@jiucaibox/shared';
import EmergencyModal from '@/components/EmergencyModal.vue';
import RiskTag from '@/components/RiskTag.vue';
import { useAnalysisStore } from '@/stores/analysis';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const analysisStore = useAnalysisStore();
const userStore = useUserStore();

const reportId = computed(() => route.params.id as string);

const currentIndex = ref(0);
const answers = ref<Array<'yes' | 'no' | 'unsure'>>([]);
const emergencyVisible = ref(false);
const saving = ref(false);

const isLastStep = computed(() => currentIndex.value >= DEEP_STEP_COUNT - 1);
const currentStep = computed(() => DEEP_STEPS[currentIndex.value]);
const currentAnswer = computed(() => answers.value[currentIndex.value] ?? null);

const totalSteps = DEEP_STEP_COUNT;
const progressPercent = computed(() => Math.round(((currentIndex.value + 1) / totalSteps) * 100));

/** 高风险信号统计 */
const highRiskYes = computed(
  () => DEEP_STEPS.filter((s, i) => s.highRisk && answers.value[i] === 'yes').length,
);
const highRiskUnsure = computed(
  () => DEEP_STEPS.filter((s, i) => s.highRisk && answers.value[i] === 'unsure').length,
);

const deepRiskLevel = computed<RiskLevel>(() => {
  if (highRiskYes.value >= 2) return 'high';
  if (highRiskYes.value === 1 || highRiskUnsure.value >= 2) return 'medium';
  return 'low';
});

const deepAlert = computed(() => {
  if (deepRiskLevel.value === 'high') {
    return '检测到多个高风险信号，强烈建议立即停止进一步接触与付款。请保留所有聊天记录、转账凭证，必要时拨打 12315 或 110。';
  }
  if (deepRiskLevel.value === 'medium') {
    return '存在一定风险信号，请保持警惕，签署任何合同、支付任何费用前务必核实资质并咨询身边人。';
  }
  return '暂未发现明显高风险信号，但仍请保持理性，不轻信任何收益承诺。';
});

function choose(answer: 'yes' | 'no' | 'unsure') {
  answers.value[currentIndex.value] = answer;
  // 命中 highRisk 且回答"是"：弹出紧急提示
  if (currentStep.value.highRisk && answer === 'yes') {
    emergencyVisible.value = true;
  }
}

function next() {
  if (!currentAnswer.value) {
    showToast('请先做出选择');
    return;
  }
  if (isLastStep.value) return;
  currentIndex.value += 1;
}

function feedbackPayload(): DeepFeedbackItem[] {
  return DEEP_STEPS.map((s, i) => ({
    step: i + 1,
    question: s.question,
    answer: answers.value[i] ?? 'no',
  }));
}

async function saveResult() {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  saving.value = true;
  try {
    await analysisStore.deepFeedback(reportId.value, feedbackPayload());
    showToast('已保存到我的测评');
    router.replace(`/analysis/result/${reportId.value}`);
  } catch {
    // 已提示
  } finally {
    saving.value = false;
  }
}

function restart() {
  currentIndex.value = 0;
  answers.value = [];
}

onMounted(async () => {
  // 预取报告（用于校验存在性）
  try {
    await analysisStore.getById(reportId.value);
  } catch {
    // 报告不存在时提示并返回
    showToast('报告不存在');
    router.replace('/analysis');
  }
});
</script>

<template>
  <van-nav-bar title="深度接洽避坑" left-arrow @click-left="router.back()" />

  <div class="page deep-page">
    <!-- 顶部进度 -->
    <div class="deep-progress">
      <div class="deep-progress__label">
        <span>第 {{ currentIndex + 1 }} 步 / 共 {{ totalSteps }} 步</span>
        <span class="text-aux">如实记录对方的话术</span>
      </div>
      <van-progress :percentage="progressPercent" :show-pivot="false" stroke-width="6" color="#4CAF50" />
    </div>

    <!-- 未完成：逐题作答 -->
    <template v-if="currentIndex < totalSteps">
      <div class="card deep-question">
        <div class="deep-question__q">{{ currentStep.question }}</div>
        <div class="deep-options">
          <div
            class="deep-option pressable"
            :class="{ 'deep-option--on': currentAnswer === 'yes' }"
            @click="choose('yes')"
          >
            <van-icon name="success" v-if="currentAnswer === 'yes'" />
            是
          </div>
          <div
            class="deep-option pressable"
            :class="{ 'deep-option--on': currentAnswer === 'no' }"
            @click="choose('no')"
          >
            <van-icon name="cross" v-if="currentAnswer === 'no'" />
            否
          </div>
          <div
            class="deep-option pressable"
            :class="{ 'deep-option--on': currentAnswer === 'unsure' }"
            @click="choose('unsure')"
          >
            <van-icon name="question-o" v-if="currentAnswer === 'unsure'" />
            不确定
          </div>
        </div>
      </div>

      <van-button block round type="primary" class="deep-next" @click="next">
        {{ isLastStep ? '查看评估结果' : '下一步' }}
      </van-button>
    </template>

    <!-- 已完成：综合评估结果 -->
    <template v-else>
      <div class="card deep-result">
        <div class="deep-result__head">
          <div class="deep-result__title">综合评估结果</div>
          <RiskTag :level="deepRiskLevel" size="lg" />
        </div>

        <div class="deep-result__alert" :class="`deep-result__alert--${deepRiskLevel}`">
          <van-icon name="warning-o" size="20" />
          <span>{{ deepAlert }}</span>
        </div>

        <div class="deep-result__stats">
          <div class="deep-result__stat">
            <div class="deep-result__num">{{ highRiskYes }}</div>
            <div class="text-aux">高风险信号「是」</div>
          </div>
          <div class="deep-result__stat">
            <div class="deep-result__num">{{ highRiskUnsure }}</div>
            <div class="text-aux">高风险信号「不确定」</div>
          </div>
        </div>

        <div class="deep-result__hint text-aux">
          评估依据：{{ DEEP_STEP_COUNT }} 项避坑清单中的高风险信号勾选情况（{{ RISK_LEVEL_META[deepRiskLevel].label }}）。
        </div>
      </div>

      <van-button block round type="primary" :loading="saving" @click="saveResult">
        保存到我的测评
      </van-button>
      <van-button block round plain type="primary" class="deep-restart" @click="restart">
        重新评估
      </van-button>
    </template>

    <div class="text-aux deep-tip">
      请如实记录，这关系到评估的准确程度。不要因为"再想想"就跳过任何一步。
    </div>

    <!-- 紧急提示弹窗 -->
    <EmergencyModal v-model:show="emergencyVisible" />
  </div>
</template>

<style scoped>
.deep-progress {
  margin: 8px 0 16px;
}

.deep-progress__label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-main);
  margin-bottom: 8px;
}

.deep-question__q {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
  color: var(--text-main);
  margin-bottom: 16px;
}

.deep-options {
  display: flex;
  gap: 10px;
}

.deep-option {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

.deep-option--on {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}

.deep-next {
  margin-top: 16px;
}

.deep-result__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.deep-result__title {
  font-size: 16px;
  font-weight: 600;
}

.deep-result__alert {
  display: flex;
  gap: 8px;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 14px;
}

.deep-result__alert--high {
  background: var(--danger-bg);
  color: var(--danger);
}

.deep-result__alert--medium {
  background: var(--warning-bg);
  color: #e65100;
}

.deep-result__alert--low {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.deep-result__stats {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.deep-result__stat {
  flex: 1;
  text-align: center;
  background: var(--bg);
  border-radius: 8px;
  padding: 12px 0;
}

.deep-result__num {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-dark);
}

.deep-result__hint {
  line-height: 1.6;
}

.deep-restart {
  margin-top: 10px;
}

.deep-tip {
  text-align: center;
  margin-top: 16px;
}
</style>
