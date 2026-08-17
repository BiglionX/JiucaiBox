<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import type { Certificate } from '@jiucaibox/shared';
import { userApi } from '@/api';

const route = useRoute();
const router = useRouter();

const cert = ref<Certificate | null>(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    cert.value = await userApi.getCertificateDetail(route.params.id as string);
  } catch {
    cert.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="学习证书" left-arrow @click-left="router.back()" />

  <div class="page cert-page">
    <div v-if="cert" class="certificate">
      <div class="certificate__seal">
        <span class="certificate__seal-text">已<br />完<br />成</span>
      </div>

      <div class="certificate__title">学习证书</div>
      <div class="certificate__sub">Certificate of Completion</div>

      <div class="certificate__honor">兹证明</div>
      <div class="certificate__name">{{ cert.userNickname }}</div>
      <div class="certificate__desc">
        已完成课程「{{ cert.courseTitle }}」的全部学习内容
      </div>

      <div class="certificate__meta">
        <div class="certificate__meta-row">
          <span class="certificate__meta-label">证书编号</span>
          <span class="certificate__meta-value">#{{ cert.certId }}</span>
        </div>
        <div class="certificate__meta-row">
          <span class="certificate__meta-label">颁发日期</span>
          <span class="certificate__meta-value">{{ cert.issuedAt.slice(0, 10) }}</span>
        </div>
      </div>

      <div class="certificate__foot">韭菜学院 · 每一滴泪花，都是路标</div>
    </div>

    <div v-else-if="!loading" class="certificate-missing">
      <p>证书不存在或已被撤销</p>
    </div>
  </div>
</template>

<style scoped>
.cert-page {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}

.certificate {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #fffdf6;
  border: 2px solid #f0d9a8;
  border-radius: 12px;
  padding: 40px 24px 24px;
  text-align: center;
}

.certificate__seal {
  position: absolute;
  top: 28px;
  right: 28px;
  width: 56px;
  height: 56px;
  border: 3px solid #f5222d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(15deg);
}

.certificate__seal-text {
  color: #f5222d;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 1px;
}

.certificate__title {
  font-size: 26px;
  font-weight: 700;
  color: #8c5a1f;
  letter-spacing: 8px;
}

.certificate__sub {
  font-size: 11px;
  color: #b08a4f;
  letter-spacing: 2px;
  margin-top: 4px;
}

.certificate__honor {
  margin-top: 28px;
  font-size: 13px;
  color: #8c8c8c;
}

.certificate__name {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.certificate__desc {
  margin-top: 10px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.certificate__meta {
  margin-top: 24px;
  padding: 14px 18px;
  background: rgba(240, 217, 168, 0.25);
  border-radius: 8px;
}

.certificate__meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
}

.certificate__meta-label {
  color: #8c8c8c;
}

.certificate__meta-value {
  color: #333;
  font-weight: 600;
}

.certificate__foot {
  margin-top: 20px;
  font-size: 11px;
  color: #b08a4f;
}

.certificate-missing {
  text-align: center;
  color: var(--text-sub);
  padding: 60px 0;
}
</style>
