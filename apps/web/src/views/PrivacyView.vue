<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <van-nav-bar title="隐私政策" left-arrow @click-left="router.back()" />

  <div class="page">
    <div class="card">
      <div class="static-title">我们如何保护你</div>
      <p class="static-paragraph">
        韭菜学院以"匿名优先、隐私至上"为原则。社区内所有展示（故事、评论）均使用匿名昵称，默认开启且不可关闭，不显示你的真实身份。
      </p>
    </div>

    <div class="card">
      <div class="static-title">我们收集的数据</div>
      <p class="static-paragraph">
        1. 登录信息：手机号（仅用于登录）、微信授权标识；<br />
        2. 内容数据：你提交的测评链接/文案、学习记录、故事与评论；<br />
        3. 设备信息：用于保障服务安全与稳定性。
      </p>
    </div>

    <div class="card">
      <div class="static-title">数据的用途</div>
      <p class="static-paragraph">
        测评数据仅用于生成风险报告；故事与评论经匿名处理后公开展示；学习记录用于为你提供学习进度服务。我们不会向任何第三方出售你的个人信息。
      </p>
    </div>

    <div class="card">
      <div class="static-title">你的权利</div>
      <p class="static-paragraph">
        你可以随时在"设置"中清除缓存、清空学习记录或注销账号。账号注销后数据进入 7 天冷静期，之后永久删除，不可恢复。
      </p>
    </div>

    <div class="card">
      <div class="static-title">联系我们</div>
      <p class="static-paragraph">
        如对隐私保护有任何疑问，请通过应用内反馈渠道联系我们。本政策更新后将在应用内公示。
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

.static-paragraph {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.9;
  margin: 0 0 12px;
}
</style>
