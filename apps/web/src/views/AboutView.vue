<script setup lang="ts">
import { useRouter } from 'vue-router';
import { BRAND } from '@jiucaibox/shared';

const router = useRouter();
</script>

<template>
  <van-nav-bar title="关于我们" left-arrow @click-left="router.back()" />

  <div class="page">
    <div class="card about-hero">
      <div class="about-hero__logo">🛡️</div>
      <div class="about-hero__name">{{ BRAND.name }}</div>
      <div class="about-hero__slogan">{{ BRAND.slogan }}</div>
    </div>

    <div class="card">
      <div class="static-title">我们的使命</div>
      <p class="static-paragraph">
        我们是一群相信"知识可以防身"的普通人。每天都有大量朋友因为直播培训、财商课程、招商加盟等话术被骗，损失的不只是钱，还有时间、信心和家庭关系。
      </p>
      <p class="static-paragraph">
        韭菜学院是一个公益防割教育平台：我们拆解骗局话术、提供风险测评工具、让真实经历被看见，帮助每一个普通人保持清醒、做出理性决定。
      </p>
    </div>

    <div class="card">
      <div class="static-title">我们承诺</div>
      <p class="static-paragraph">
        1. 不承诺任何收益，不卖任何"稳赚"课程；<br />
        2. 全部课程免费开放，个体效果差异极大；<br />
        3. 社区强制匿名，保护每一位分享者的隐私；<br />
        4. 内容基于公开信息与真实案例，结果仅供参考。
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-hero {
  text-align: center;
  padding: 32px 16px;
}

.about-hero__logo {
  font-size: 48px;
  margin-bottom: 8px;
}

.about-hero__name {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-dark);
}

.about-hero__slogan {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}

.static-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.static-paragraph {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.9;
  margin: 0 0 12px;
}
</style>
