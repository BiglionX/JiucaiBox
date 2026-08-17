<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import type { UploaderFileListItem } from 'vant';
import { LOSS_TYPE_LABELS, STORY_CATEGORY_LABELS } from '@jiucaibox/shared';
import type { LossType, StoryCategory } from '@jiucaibox/shared';
import { storyApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const userStore = useUserStore();

const category = ref<StoryCategory | ''>('');
const lossAmount = ref<string>('');
const lossTypes = ref<LossType[]>([]);
const content = ref('');
const tricks = ref('');
const oneLiner = ref('');
const images = ref<UploaderFileListItem[]>([]);
const submitting = ref(false);

const categories = Object.keys(STORY_CATEGORY_LABELS) as StoryCategory[];
const lossTypeOptions = (Object.keys(LOSS_TYPE_LABELS) as LossType[]).map((k) => ({
  label: LOSS_TYPE_LABELS[k],
  value: k,
}));

/** 图片转 base64（MVP：直接随故事提交；生产应改为上传接口返回 URL） */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

/** afterRead：读取本地文件为 base64 并回填到列表项 */
async function afterRead(item: { file?: File }) {
  if (!item.file) return;
  try {
    const url = await fileToBase64(item.file);
    images.value = images.value.map((img) => (img.file === item.file ? { ...img, url } : img));
  } catch {
    showToast('图片读取失败，请重试');
  }
}

function autoTitle(): string {
  const label = category.value ? STORY_CATEGORY_LABELS[category.value] : '';
  const amount = lossAmount.value ? formatMoney(Number(lossAmount.value)) : '';
  if (label && amount) return `被${label}割了${amount}`;
  if (label) return `我的${label}经历`;
  return '我的被骗经历';
}

async function submit() {
  if (!userStore.isLoggedIn) {
    userStore.openLogin();
    return;
  }
  if (!category.value) {
    showToast('请选择你被割的领域');
    return;
  }
  if (content.value.trim().length < 10) {
    showToast('事情经过至少写 10 个字');
    return;
  }
  if (!tricks.value.trim()) {
    showToast('请写下对方的套路');
    return;
  }

  submitting.value = true;
  try {
    const body = content.value.trim();
    const tricksSection = tricks.value.trim();
    await storyApi.createStory({
      category: category.value,
      lossAmount: lossAmount.value ? Number(lossAmount.value) : null,
      lossTypes: lossTypes.value,
      title: autoTitle(),
      // 后端暂无"套路"独立字段：以小节形式并入正文；"想对大家说的话"映射到 lesson
      content: tricksSection ? `${body}\n\n【对方的套路】${tricksSection}` : body,
      lesson: oneLiner.value.trim() || undefined,
      images: images.value.map((i) => i.url).filter((u): u is string => Boolean(u)),
    });
    showToast('感谢分享，审核通过后将展示');
    router.replace('/courses');
  } catch {
    // 已提示
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  showConfirmDialog({
    title: '隐私保护说明',
    message:
      '你的分享将以匿名昵称展示，不显示真实身份。请勿上传含身份证号、银行卡号、清晰手机号等个人信息的图片，平台会自动打码处理。',
    confirmButtonText: '我知道了',
    showCancelButton: false,
  }).catch(() => {
    // 用户关闭弹窗也继续填写
  });
});
</script>

<template>
  <van-nav-bar title="说出你的经历" left-arrow @click-left="router.back()" />

  <div class="page">
    <div class="card">
      <!-- 领域单选 -->
      <div class="form-label">我被割的领域 <span class="text-danger">*</span></div>
      <van-radio-group v-model="category" direction="horizontal">
        <van-radio
          v-for="c in categories"
          :key="c"
          :name="c"
          class="form-radio"
        >
          {{ STORY_CATEGORY_LABELS[c] }}
        </van-radio>
      </van-radio-group>

      <!-- 损失金额 -->
      <div class="form-label">损失金额（元，可选）</div>
      <van-field
        v-model="lossAmount"
        type="number"
        placeholder="如实填写，不夸大也不隐瞒"
        clearable
        :border="false"
      />

      <!-- 损失类型多选 -->
      <div class="form-label">损失类型（可多选）</div>
      <van-checkbox-group v-model="lossTypes" direction="horizontal">
        <van-checkbox
          v-for="opt in lossTypeOptions"
          :key="opt.value"
          :name="opt.value"
          class="form-checkbox"
        >
          {{ opt.label }}
        </van-checkbox>
      </van-checkbox-group>

      <!-- 事情经过 -->
      <div class="form-label">事情经过 <span class="text-danger">*</span></div>
      <van-field
        v-model="content"
        type="textarea"
        rows="5"
        autosize
        :maxlength="5000"
        show-word-limit
        placeholder="从什么时候接触、对方怎么带你入局、发生了什么（至少 10 个字）"
      />

      <!-- 对方的套路 -->
      <div class="form-label">对方的套路 <span class="text-danger">*</span></div>
      <van-field
        v-model="tricks"
        type="textarea"
        rows="3"
        autosize
        :maxlength="2000"
        show-word-limit
        placeholder="对方是怎么让你相信的？比如承诺收益、话术压迫等"
      />

      <!-- 想对大家说的一句话 -->
      <div class="form-label">想对大家说的一句话（可选）</div>
      <van-field
        v-model="oneLiner"
        maxlength="100"
        placeholder="比如：别信「稳赚」，清醒比什么都重要"
        clearable
        :border="false"
      />

      <!-- 图片上传 -->
      <div class="form-label">图片证据（可选）</div>
      <van-uploader
        v-model="images"
        :max-count="6"
        multiple
        :after-read="afterRead"
      />
      <div class="text-aux upload-tip">
        将自动打码，请勿上传含身份证/银行卡/手机号的清晰图片
      </div>
    </div>

    <van-button block round type="primary" :loading="submitting" @click="submit">
      匿名发布
    </van-button>
    <div class="text-aux mt8" style="text-align: center">
      发布后需审核，审核通过后才会展示给其他人
    </div>
  </div>
</template>

<style scoped>
.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 12px 0 8px;
}

.form-radio {
  margin-right: 16px;
  margin-bottom: 6px;
}

.form-checkbox {
  margin-right: 16px;
  margin-bottom: 6px;
}

.upload-tip {
  margin-top: 6px;
}
</style>
