<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Certificate } from '@jiucaibox/shared';
import { userApi } from '@/api';
import EmptyState from '@/components/EmptyState.vue';

const router = useRouter();

const list = ref<Certificate[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    list.value = await userApi.getCertificates();
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="我的证书" left-arrow @click-left="router.back()" />

  <div class="page">
    <div v-if="list.length" class="cert-list">
      <div
        v-for="cert in list"
        :key="cert.certId"
        class="card cert-card pressable"
        @click="router.push(`/mine/certificates/${cert.certId}`)"
      >
        <div class="cert-card__badge">
          <van-icon name="certificate" size="26" color="#fff" />
        </div>
        <div class="cert-card__body">
          <div class="cert-card__title">{{ cert.courseTitle }}</div>
          <div class="cert-card__meta">
            证书编号 #{{ cert.certId }} · {{ cert.issuedAt.slice(0, 10) }}
          </div>
        </div>
        <van-icon name="arrow" color="#C8C9CC" size="14" />
      </div>
    </div>

    <EmptyState
      v-else-if="!loading"
      text="暂无证书"
      description="完成课程全部视频的学习后，将自动颁发学习证书"
    />
  </div>
</template>

<style scoped>
.cert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.cert-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cert-card__badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f5222d, #fa8c16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cert-card__body {
  flex: 1;
  min-width: 0;
}

.cert-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.cert-card__meta {
  font-size: 12px;
  color: var(--text-sub);
}
</style>
