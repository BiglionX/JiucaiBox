<script setup lang="ts">
import { useRouter } from 'vue-router';
import { DISCLAIMER } from '@jiucaibox/shared';

const router = useRouter();
</script>

<template>
  <van-nav-bar title="免责声明" left-arrow @click-left="router.back()" />

  <div class="page">
    <div class="card">
      <div class="static-title">核心声明</div>
      <div class="static-quote">{{ DISCLAIMER }}</div>
      <p class="static-paragraph">
        本平台不承诺任何收益，个体效果差异极大。任何宣称"稳赚""保本""躺赚"的内容，都请保持警惕。
      </p>
    </div>

    <div class="card">
      <div class="static-title">详细说明</div>
      <p class="static-paragraph">
        1. 本平台所有测评结果、课程内容、案例分析均由 AI 生成或人工整理，仅供教育参考，不构成事实认定、投资建议或法律意见。
      </p>
      <p class="static-paragraph">
        2. 测评工具基于公开话术特征与风险词库进行比对，结果可能存在偏差，请结合自身判断谨慎使用。
      </p>
      <p class="static-paragraph">
        3. 社区故事均为用户匿名分享，平台已尽力脱敏与审核，但不对其真实性、完整性作任何担保。
      </p>
      <p class="static-paragraph">
        4. 如您正在遭受损失或面临威胁，请立即停止支付，保留证据，拨打 12315 或 110，并联系家人朋友。
      </p>
      <p class="static-paragraph">
        5. 使用本平台即视为您已知悉并同意本免责声明。
      </p>
    </div>
  </div>
</template>

<style scoped>
.static-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.static-quote {
  background: var(--bg);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.8;
  margin-bottom: 12px;
}

.static-paragraph {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.9;
  margin: 0 0 12px;
}
</style>
