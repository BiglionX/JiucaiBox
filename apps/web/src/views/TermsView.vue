<script setup lang="ts">
import { useRouter } from 'vue-router';
import { DISCLAIMER } from '@jiucaibox/shared';

const router = useRouter();
</script>

<template>
  <van-nav-bar title="用户协议" left-arrow @click-left="router.back()" />

  <div class="page">
    <div class="card">
      <div class="static-title">一、服务说明</div>
      <p class="static-paragraph">
        韭菜学院（JiucaiBox）是一个公益防割教育平台，提供测评工具、免费课程、社区分享与骗局速报等服务。本平台不承诺任何收益，个体效果差异极大。
      </p>
    </div>

    <div class="card">
      <div class="static-title">二、账号与匿名</div>
      <p class="static-paragraph">
        1. 你可以游客身份浏览大部分内容；<br />
        2. 发布故事、评论、抱抱等操作需要登录；<br />
        3. 社区内容强制匿名展示，昵称可自行修改，但不得包含违法违规或侵权内容。
      </p>
    </div>

    <div class="card">
      <div class="static-title">三、用户行为规范</div>
      <p class="static-paragraph">
        1. 不得发布虚假、诈骗、辱骂、攻击性内容；<br />
        2. 不得在社区中引流、售卖课程或实施任何形式的诈骗；<br />
        3. 不得上传含他人隐私（身份证、银行卡、清晰手机号）的图片；<br />
        4. 违反者平台有权删除内容、封禁账号并保留追责权利。
      </p>
    </div>

    <div class="card">
      <div class="static-title">四、免责声明</div>
      <div class="static-quote">{{ DISCLAIMER }}</div>
      <p class="static-paragraph">
        社区故事为匿名用户分享，平台仅作脱敏与形式审核，内容观点不代表平台立场。因使用本平台信息产生的任何决策后果，由使用者自行承担。
      </p>
    </div>

    <div class="card">
      <div class="static-title">五、协议变更</div>
      <p class="static-paragraph">
        我们可能适时修订本协议，修订后的协议将在应用内公示，继续使用即视为接受修订内容。
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
