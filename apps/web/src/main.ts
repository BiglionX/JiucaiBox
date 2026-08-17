import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vant from 'vant';
import 'vant/lib/index.css';

import App from './App.vue';
import router from './router';
import './styles/theme.css';

// 大字模式开机恢复
if (localStorage.getItem('jiucaibox_large_text') === '1') {
  document.documentElement.classList.add('large-text');
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Vant);

app.mount('#app');
