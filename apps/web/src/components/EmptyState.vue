<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string;
    description?: string;
    emoji?: string;
  }>(),
  {
    text: '这里还空空的',
    description: '',
    emoji: '🌱',
  },
);
</script>

<template>
  <div class="empty-wrap">
    <div class="empty-emoji">{{ emoji }}</div>
    <div class="empty-text">{{ text }}</div>
    <div v-if="description" class="empty-desc">{{ description }}</div>
    <div class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-wrap {
  padding: 48px 16px;
  text-align: center;
}

.empty-emoji {
  font-size: 56px;
  line-height: 1;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-sub);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-sub);
  opacity: 0.8;
  margin-bottom: 12px;
}

.empty-action {
  margin-top: 12px;
}
</style>
