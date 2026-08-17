<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { LIMITS } from '@jiucaibox/shared';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

/** 内置 8 款防割主题头像 */
const AVATAR_OPTIONS = ['🛡️', '🌿', '💧', '📖', '🧭', '🤝', '🔍', '🌟'];

const avatar = ref('');
const nickname = ref('');
const bio = ref('');
const saving = ref(false);

onMounted(() => {
  const p = userStore.profile;
  if (p) {
    avatar.value = p.avatar || '🛡️';
    nickname.value = p.nickname || '';
    bio.value = p.bio || '';
  }
});

const nicknameValid = computed(() => {
  const len = Array.from(nickname.value.trim()).length;
  return len >= LIMITS.nicknameMin && len <= LIMITS.nicknameMax;
});

async function save() {
  if (!nicknameValid.value) {
    showToast(`昵称需为 ${LIMITS.nicknameMin}-${LIMITS.nicknameMax} 个字符`);
    return;
  }
  saving.value = true;
  try {
    await userStore.updateProfile({
      nickname: nickname.value.trim(),
      avatar: avatar.value,
      bio: bio.value.trim(),
    });
    showToast('保存成功');
    router.back();
  } catch {
    // 已提示
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <van-nav-bar title="编辑资料" left-arrow @click-left="router.back()" />

  <div class="page">
    <div class="card">
      <div class="form-label">选择头像</div>
      <div class="avatar-picker">
        <span
          v-for="opt in AVATAR_OPTIONS"
          :key="opt"
          class="avatar-option pressable"
          :class="{ 'avatar-option--on': avatar === opt }"
          @click="avatar = opt"
        >
          {{ opt }}
        </span>
      </div>

      <div class="form-label">昵称（2-12 个字符，匿名展示）</div>
      <van-field
        v-model="nickname"
        :maxlength="12"
        placeholder="给自己起个匿名昵称"
        clearable
        :border="false"
      />

      <div class="form-label">简介（≤ 50 字，可选）</div>
      <van-field
        v-model="bio"
        type="textarea"
        rows="2"
        autosize
        :maxlength="LIMITS.bioMax"
        show-word-limit
        placeholder="一句话介绍自己"
      />

      <div class="text-aux mt8">平台默认强制匿名，社区展示不会暴露你的真实身份。</div>
    </div>

    <van-button block round type="primary" :loading="saving" @click="save">保存</van-button>
  </div>
</template>

<style scoped>
.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 12px 0 10px;
}

.avatar-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.avatar-option {
  height: 52px;
  border-radius: 8px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border: 2px solid transparent;
  cursor: pointer;
}

.avatar-option--on {
  border-color: var(--primary);
  background: var(--primary-light);
}
</style>
