<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon">韭</div>
        <div class="brand-title">韭菜学院 · 管理后台</div>
        <div class="brand-sub">每一滴泪花，都是路标</div>
      </div>

      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical" @finish="onSubmit">
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="form.username"
            size="large"
            placeholder="请输入用户名（默认 admin）"
            allow-clear
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="form.password"
            size="large"
            placeholder="请输入密码（默认 jiucai123456）"
            @press-enter="onSubmit"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-button type="primary" size="large" block :loading="loading" @click="onSubmit">
          登 录
        </a-button>
      </a-form>

      <div class="login-hint">演示账号：admin / jiucai123456</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, type FormInstance } from 'ant-design-vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: 'admin',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    await auth.login(form.username.trim(), form.password);
    message.success('登录成功');
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.replace(redirect);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
}
.login-card {
  width: 400px;
  padding: 40px 36px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
.login-brand {
  text-align: center;
  margin-bottom: 28px;
}
.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5222d, #fa8c16);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}
.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.88);
}
.brand-sub {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}
.login-hint {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
}
</style>
