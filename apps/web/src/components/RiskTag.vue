<script setup lang="ts">
import { computed } from 'vue';
import { RISK_LEVEL_META } from '@jiucaibox/shared';
import type { RiskLevel } from '@jiucaibox/shared';

const props = withDefaults(
  defineProps<{ level?: RiskLevel | null; size?: 'sm' | 'lg' }>(),
  { level: null, size: 'sm' },
);

const meta = computed(() => (props.level ? RISK_LEVEL_META[props.level] : null));
const label = computed(() => meta.value?.label ?? '未知');
const color = computed(() => meta.value?.color ?? '#757575');
const bg = computed(() => meta.value?.bgColor ?? '#F0F0F0');
</script>

<template>
  <span class="risk-tag" :class="`risk-tag--${size}`" :style="{ color, background: bg }">
    {{ label }}
  </span>
</template>

<style scoped>
.risk-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.risk-tag--sm {
  font-size: 12px;
  padding: 1px 8px;
  line-height: 1.6;
}

.risk-tag--lg {
  font-size: 18px;
  padding: 6px 20px;
  border-radius: 8px;
}
</style>
