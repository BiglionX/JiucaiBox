import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import App from './App.vue';
import router from './router';

dayjs.locale('zh-cn');

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Antd);

// 统一错误兜底：接口错误已在拦截器提示，此处仅记录日志
app.config.errorHandler = (err) => {
  console.error('[admin]', err);
};

app.mount('#app');
