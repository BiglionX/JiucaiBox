<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showToast } from 'vant';
import { useUserStore } from '@/stores/user';
import { useStoryStore } from '@/stores/story';

const props = defineProps<{
  storyId: number;
  count: number;
  hugged?: boolean;
  size?: 'sm' | 'lg';
}>();

const userStore = useUserStore();
const storyStore = useStoryStore();

const localCount = ref(props.count);
const localHugged = ref(Boolean(props.hugged));
const hugging = ref(false);
const anim = ref(false);

onMounted(() => {
  localCount.value = props.count;
  localHugged.value = Boolean(props.hugged);
});

watch(
  () => [props.count, props.hugged] as const,
  ([c, h]) => {
    localCount.value = c;
    localHugged.value = Boolean(h);
  },
);

async function onHug() {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  if (localHugged.value) {
    showToast('你已经抱过啦，谢谢温暖');
    return;
  }
  if (hugging.value) return;
  hugging.value = true;
  try {
    const ok = await storyStore.hug(props.storyId);
    if (ok) {
      localHugged.value = true;
      localCount.value += 1;
      anim.value = true;
      window.setTimeout(() => (anim.value = false), 420);
      showToast('抱抱已送达');
    }
  } finally {
    hugging.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="hug-btn pressable"
    :class="[`hug-btn--${size}`, { 'hug-btn--hugged': localHugged, 'hug-anim': anim }]"
    :disabled="hugging"
    @click.stop="onHug"
  >
    <van-icon :name="localHugged ? 'like' : 'like-o'" :class="{ 'hug-btn__icon--on': localHugged }" />
    <span>{{ localCount }}</span>
  </button>
</template>

<style scoped>
.hug-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 20px;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.hug-btn--sm {
  padding: 5px 12px;
}

.hug-btn--lg {
  padding: 10px 24px;
  font-size: 14px;
}

.hug-btn--hugged {
  border-color: #ffb3b3;
  color: var(--danger);
  background: #fff5f5;
}

.hug-btn__icon--on {
  color: var(--danger);
}
</style>
