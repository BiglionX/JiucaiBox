<script setup lang="ts">
import { ref } from 'vue';
import { showToast } from 'vant';
import type { QuizQuestion } from '@jiucaibox/shared';
import { courseApi, type QuizAnswerResult } from '@/api';
import { useUserStore } from '@/stores/user';

const props = defineProps<{ question: QuizQuestion; index?: number }>();

const userStore = useUserStore();

const selected = ref<number | null>(null);
const submitted = ref(false);
const submitting = ref(false);
const result = ref<QuizAnswerResult | null>(null);

function choose(i: number) {
  if (submitted.value || submitting.value) return;
  selected.value = i;
}

async function submit() {
  if (selected.value === null) {
    showToast('请先选择一个选项');
    return;
  }
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  submitting.value = true;
  try {
    result.value = await courseApi.submitQuiz(props.question.id, selected.value);
    submitted.value = true;
    if (result.value.correct) {
      showToast('回答正确，认知又进了一步');
    }
  } catch {
    // 已提示
  } finally {
    submitting.value = false;
  }
}

function reset() {
  submitted.value = false;
  result.value = null;
  selected.value = null;
}

function optionClass(i: number): string {
  if (!submitted.value) {
    return selected.value === i ? 'quiz-option--selected' : '';
  }
  if (i === result.value?.correctOption) return 'quiz-option--correct';
  if (i === selected.value) return 'quiz-option--wrong';
  return 'quiz-option--dim';
}
</script>

<template>
  <div class="quiz-card card">
    <div class="quiz-card__chapter" v-if="index !== undefined">第 {{ index }} 题</div>
    <div class="quiz-card__question">{{ question.question }}</div>

    <div class="quiz-options">
      <div
        v-for="(opt, i) in question.options"
        :key="i"
        class="quiz-option pressable"
        :class="optionClass(i)"
        @click="choose(i)"
      >
        <span class="quiz-option__mark">{{ String.fromCharCode(65 + i) }}</span>
        <span class="quiz-option__text">{{ opt }}</span>
        <van-icon v-if="submitted && i === result?.correctOption" name="success" color="#4CAF50" />
        <van-icon v-else-if="submitted && i === selected && result && !result.correct" name="cross" color="#F44336" />
      </div>
    </div>

    <div v-if="!submitted" class="quiz-card__action">
      <van-button type="primary" round size="small" :loading="submitting" @click="submit">
        提交答案
      </van-button>
    </div>

    <div v-else class="quiz-result">
      <div class="quiz-result__verdict" :class="result?.correct ? 'quiz-result__verdict--ok' : 'quiz-result__verdict--no'">
        <van-icon :name="result?.correct ? 'success' : 'cross'" />
        {{ result?.correct ? '回答正确' : '回答有偏差' }}
      </div>
      <div class="quiz-result__explain">
        <div class="quiz-result__label">真实数据与解析</div>
        {{ result?.explanation || question.explanation }}
      </div>
      <van-button plain type="primary" round size="small" class="quiz-result__again" @click="reset">
        重新评估
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.quiz-card__chapter {
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 4px;
}

.quiz-card__question {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 12px;
  line-height: 1.6;
}

.quiz-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
}

.quiz-option__mark {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg);
  color: var(--text-sub);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.quiz-option__text {
  flex: 1;
}

.quiz-option--selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.quiz-option--selected .quiz-option__mark {
  background: var(--primary);
  color: #fff;
}

.quiz-option--correct {
  border-color: var(--primary);
  background: var(--primary-light);
}

.quiz-option--wrong {
  border-color: var(--danger);
  background: var(--danger-bg);
}

.quiz-option--dim {
  opacity: 0.55;
}

.quiz-card__action {
  text-align: right;
  margin-top: 4px;
}

.quiz-result {
  margin-top: 8px;
  border-top: 1px dashed var(--border);
  padding-top: 12px;
}

.quiz-result__verdict {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.quiz-result__verdict--ok {
  color: var(--primary-dark);
}

.quiz-result__verdict--no {
  color: var(--danger);
}

.quiz-result__label {
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 4px;
}

.quiz-result__explain {
  font-size: 13px;
  color: var(--text-main);
  line-height: 1.7;
  background: var(--bg);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.quiz-result__again {
  display: inline-flex;
}
</style>
