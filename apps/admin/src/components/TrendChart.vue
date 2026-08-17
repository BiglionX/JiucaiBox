<template>
  <div class="trend-chart">
    <div v-if="maxCount === 0" class="empty">暂无数据</div>
    <div v-else class="bars">
      <div v-for="(item, index) in data" :key="index" class="bar-col" :title="`${item.date}：${item.count}`">
        <div class="bar-value">{{ item.count }}</div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ height: calcHeight(item.count) + '%', backgroundColor: color }"
          ></div>
        </div>
        <div class="bar-label">{{ shortDate(item.date) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TrendPoint {
  date: string;
  count: number;
}

const props = withDefaults(
  defineProps<{
    data: TrendPoint[];
    color?: string;
  }>(),
  { color: '#1677ff' },
);

const maxCount = computed(() => props.data.reduce((max, p) => Math.max(max, p.count), 0));

/** 柱高百分比（相对最大值），最小 4% 便于观察 */
function calcHeight(count: number): number {
  if (maxCount.value <= 0) return 0;
  return Math.max(4, Math.round((count / maxCount.value) * 100));
}

/** 展示 MM-DD */
function shortDate(date: string): string {
  const parts = date.split('-');
  return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : date;
}
</script>

<style scoped>
.trend-chart {
  width: 100%;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding-top: 8px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 0;
}
.bar-value {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 4px;
  line-height: 1.2;
}
.bar-track {
  flex: 1;
  width: 100%;
  max-width: 40px;
  position: relative;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}
.bar-label {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}
.empty {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.35);
}
</style>
