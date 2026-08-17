<script setup lang="ts">
const props = defineProps<{ show: boolean; content?: string }>();
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>();
</script>

<template>
  <van-dialog
    :show="props.show"
    @update:show="(v: boolean) => emit('update:show', v)"
    title="注意！这可能是套路"
    confirm-button-text="我知道了"
    :show-cancel-button="false"
    class="truth-dialog"
  >
    <div class="truth-content">
      <div class="truth-content__icon">
        <van-icon name="warning-o" size="28" color="#FF9800" />
      </div>
      <div class="truth-content__text">{{ props.content || '这里存在典型的套路话术，请务必保持冷静，不要被情绪裹挟做出决定。' }}</div>
    </div>
  </van-dialog>
</template>

<style scoped>
.truth-dialog {
  max-width: 85vw;
}

.truth-content {
  padding: 8px 16px 20px;
  text-align: center;
}

.truth-content__icon {
  margin-bottom: 8px;
}

.truth-content__text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-main);
  text-align: left;
}
</style>
