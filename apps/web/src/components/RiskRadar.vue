<script setup lang="ts">
import { computed, ref } from 'vue';
import { DIMENSION_LABELS, RISK_LEVEL_META } from '@jiucaibox/shared';
import type { RiskDimension, RiskLevel } from '@jiucaibox/shared';

const props = withDefaults(
  defineProps<{
    dimensions: RiskDimension[];
    level?: RiskLevel | null;
  }>(),
  { level: null },
);

/** 各维度说明（点击后展示） */
const DIM_DESC: Record<string, string> = {
  income: '对方是否承诺了具体收益，如"月入过万""稳赚不赔""躺赚"等，属于典型收益承诺信号。',
  urgency: '是否使用倒计时、限时优惠、名额紧张、错过再等一年等话术，制造决策焦虑。',
  fakeCase: '是否展示无法查证的学员收益截图、转账记录或"成功案例"，缺乏可核实来源。',
  opaque: '是否回避公司资质、合同细节、退款条款、真实讲师背景等关键信息。',
  compliance: '是否涉及无资质荐股、传销层级、违规集资、诱导贷款等合规风险。',
};

const activeIndex = ref(0);

const barColor = computed(() => {
  const level = props.level ?? 'medium';
  return RISK_LEVEL_META[level].color;
});

/** 维度显示名：兼容后端返回 key 或中文名 */
function dimName(name: string): string {
  return DIMENSION_LABELS[name] ?? name;
}

function dimDesc(name: string): string {
  const desc = DIM_DESC[name] ?? DIM_DESC[dimName(name)];
  if (desc) return desc;
  // 反向匹配：name 是中文时找 key
  const key = Object.keys(DIMENSION_LABELS).find((k) => DIMENSION_LABELS[k] === name);
  return (key && DIM_DESC[key]) || '该维度反映对应风险信号的出现强度。';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}
</script>

<template>
  <div class="risk-radar">
    <div class="risk-radar__bars">
      <div
        v-for="(dim, idx) in dimensions"
        :key="dim.name + idx"
        class="risk-radar__row pressable"
        :class="{ active: idx === activeIndex }"
        @click="activeIndex = idx"
      >
        <div class="risk-radar__label">
          <span>{{ dimName(dim.name) }}</span>
          <span class="risk-radar__score">{{ clampScore(dim.score) }}</span>
        </div>
        <div class="risk-bar">
          <div
            class="risk-bar__fill"
            :style="{ width: `${clampScore(dim.score)}%`, background: barColor }"
          />
        </div>
      </div>
    </div>

    <div v-if="dimensions.length" class="risk-radar__desc">
      <div class="risk-radar__desc-title">{{ dimName(dimensions[activeIndex]?.name ?? '') }}</div>
      <div class="risk-radar__desc-text">
        {{ dimDesc(dimensions[activeIndex]?.name ?? '') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.risk-radar__row {
  margin-bottom: 14px;
  cursor: pointer;
}

.risk-radar__row.active .risk-radar__label {
  color: var(--primary-dark);
  font-weight: 600;
}

.risk-radar__label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-main);
  margin-bottom: 6px;
}

.risk-radar__score {
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}

.risk-radar__desc {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.risk-radar__desc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.risk-radar__desc-text {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.6;
}
</style>
