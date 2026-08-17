<script setup lang="ts">
import { EMERGENCY_TEXT } from '@jiucaibox/shared';

const props = defineProps<{ show: boolean; text?: string }>();
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>();
</script>

<template>
  <van-popup
    :show="props.show"
    :close-on-click-overlay="false"
    :close-on-popstate="false"
    class="emergency-popup"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <div class="emergency-inner">
      <van-icon name="warning-o" size="44" color="#FFFFFF" />
      <div class="emergency-title">紧急提醒</div>
      <div class="emergency-text">{{ props.text || EMERGENCY_TEXT }}</div>
      <van-button round block color="#FFFFFF" text-color="#F44336" class="emergency-btn" @click="emit('update:show', false)">
        我知道了
      </van-button>
    </div>
  </van-popup>
</template>

<style scoped>
.emergency-popup {
  width: 86vw;
  max-width: 480px;
  border-radius: 12px;
  background: #f44336;
  overflow: hidden;
}

.emergency-inner {
  padding: 28px 24px;
  text-align: center;
  color: #ffffff;
}

.emergency-title {
  font-size: 20px;
  font-weight: 700;
  margin: 12px 0 10px;
  letter-spacing: 2px;
}

.emergency-text {
  font-size: 15px;
  line-height: 1.9;
  text-align: left;
  margin-bottom: 20px;
}

.emergency-btn {
  font-weight: 600;
}
</style>
