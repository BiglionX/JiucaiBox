<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { showToast } from 'vant';
import { useUserStore } from '@/stores/user';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>();

const userStore = useUserStore();

const phone = ref('');
const code = ref('');
const sending = ref(false);
const countdown = ref(0);
const loggingIn = ref(false);
const loggingWechat = ref(false);

let timer: number | undefined;

const phoneValid = computed(() => /^1\d{10}$/.test(phone.value));
const codeValid = computed(() => /^\d{6}$/.test(code.value));

function sendCode() {
  if (!phoneValid.value) {
    showToast('请输入正确的手机号');
    return;
  }
  sending.value = true;
  countdown.value = 60;
  showToast('验证码已发送（测试环境请输入任意 6 位数字）');
  timer = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      sending.value = false;
      window.clearInterval(timer);
    }
  }, 1000);
}

async function handlePhoneLogin() {
  if (!codeValid.value) {
    showToast('请输入 6 位验证码');
    return;
  }
  loggingIn.value = true;
  try {
    await userStore.loginByPhone(phone.value, code.value);
    showToast('登录成功，欢迎回来');
    close();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loggingIn.value = false;
  }
}

async function handleWechatLogin() {
  loggingWechat.value = true;
  try {
    await userStore.wechatLogin();
    showToast('登录成功，欢迎回来');
    close();
  } catch {
    // 已提示
  } finally {
    loggingWechat.value = false;
  }
}

function close() {
  emit('update:show', false);
}

function guestContinue() {
  close();
  showToast('游客也可以浏览和学习，发布内容需要登录');
}

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <van-popup
    :show="props.show"
    position="bottom"
    round
    :style="{ maxWidth: '640px', margin: '0 auto' }"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <div class="login-modal">
      <div class="login-modal__head">
        <div class="login-modal__title">登录韭菜学院</div>
        <div class="login-modal__sub">匿名优先，社区互动默认不显示真实身份</div>
      </div>

      <van-field
        v-model="phone"
        type="tel"
        maxlength="11"
        label="手机号"
        placeholder="请输入手机号"
        :border="false"
      />
      <van-field
        v-model="code"
        type="digit"
        maxlength="6"
        label="验证码"
        placeholder="6 位验证码"
        :border="false"
      >
        <template #button>
          <van-button
            size="small"
            type="primary"
            plain
            round
            :disabled="sending || countdown > 0"
            @click="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </van-button>
        </template>
      </van-field>

      <van-button
        block
        round
        type="primary"
        class="login-btn"
        :loading="loggingIn"
        :disabled="!phoneValid || !codeValid"
        @click="handlePhoneLogin"
      >
        手机号登录
      </van-button>

      <div class="login-modal__divider"><span>或</span></div>

      <van-button block round plain type="primary" :loading="loggingWechat" @click="handleWechatLogin">
        <van-icon name="wechat" class="wechat-icon" />
        微信一键登录
      </van-button>

      <div class="login-modal__guest" @click="guestContinue">游客继续浏览</div>

      <div class="login-modal__tip">登录即代表同意《用户协议》与《隐私政策》</div>
    </div>
  </van-popup>
</template>

<style scoped>
.login-modal {
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
}

.login-modal__head {
  margin-bottom: 16px;
}

.login-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.login-modal__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub);
}

.login-btn {
  margin-top: 16px;
}

.login-modal__divider {
  display: flex;
  align-items: center;
  color: var(--text-sub);
  font-size: 12px;
  margin: 16px 0;
}

.login-modal__divider::before,
.login-modal__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.login-modal__divider span {
  padding: 0 12px;
}

.wechat-icon {
  margin-right: 4px;
  color: var(--primary);
}

.login-modal__guest {
  text-align: center;
  color: var(--text-sub);
  font-size: 14px;
  margin-top: 16px;
  padding: 8px;
}

.login-modal__guest:active {
  opacity: 0.7;
}

.login-modal__tip {
  text-align: center;
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 8px;
}
</style>
