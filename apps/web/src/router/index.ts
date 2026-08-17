/**
 * 路由表：全部页面懒加载，默认重定向到 /home
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('@/views/AnalysisView.vue'),
    meta: { title: '反割测评' },
  },
  {
    path: '/analysis/result/:id',
    name: 'analysis-result',
    component: () => import('@/views/AnalysisResultView.vue'),
    meta: { title: '测评报告' },
  },
  {
    path: '/analysis/deep/:id',
    name: 'analysis-deep',
    component: () => import('@/views/DeepFlowView.vue'),
    meta: { title: '深度接洽避坑' },
  },
  {
    path: '/courses',
    name: 'courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: { title: '真相课' },
  },
  {
    path: '/course/:id',
    name: 'course-detail',
    component: () => import('@/views/CourseDetailView.vue'),
    meta: { title: '课程详情' },
  },
  {
    path: '/stories',
    name: 'stories',
    component: () => import('@/views/StoriesView.vue'),
    meta: { title: '韭菜的泪花' },
  },
  {
    path: '/stories/new',
    name: 'story-new',
    component: () => import('@/views/StoryNewView.vue'),
    meta: { title: '说出你的经历' },
  },
  {
    path: '/stories/:id',
    name: 'story-detail',
    component: () => import('@/views/StoryDetailView.vue'),
    meta: { title: '故事详情' },
  },
  {
    path: '/radio',
    name: 'radio',
    component: () => import('@/views/RadioView.vue'),
    meta: { title: '韭菜电台' },
  },
  {
    path: '/radio/:id',
    name: 'radio-detail',
    component: () => import('@/views/RadioDetailView.vue'),
    meta: { title: '电台速报' },
  },
  {
    path: '/mine',
    name: 'mine',
    component: () => import('@/views/MineView.vue'),
    meta: { title: '我的' },
  },
  {
    path: '/mine/edit',
    name: 'mine-edit',
    component: () => import('@/views/MineEditView.vue'),
    meta: { title: '编辑资料' },
  },
  {
    path: '/mine/learning',
    name: 'mine-learning',
    component: () => import('@/views/MineLearningView.vue'),
    meta: { title: '学习记录' },
  },
  {
    path: '/mine/analysis',
    name: 'mine-analysis',
    component: () => import('@/views/MineAnalysisView.vue'),
    meta: { title: '我的测评' },
  },
  {
    path: '/mine/stories',
    name: 'mine-stories',
    component: () => import('@/views/MineStoriesView.vue'),
    meta: { title: '我的故事' },
  },
  {
    path: '/mine/interactions',
    name: 'mine-interactions',
    component: () => import('@/views/MineInteractionsView.vue'),
    meta: { title: '我的互动' },
  },
  {
    path: '/mine/notifications',
    name: 'mine-notifications',
    component: () => import('@/views/NotificationsView.vue'),
    meta: { title: '消息通知' },
  },
  {
    path: '/mine/certificates',
    name: 'mine-certificates',
    component: () => import('@/views/MineCertificatesView.vue'),
    meta: { title: '我的证书' },
  },
  {
    path: '/mine/certificates/:id',
    name: 'mine-certificate-detail',
    component: () => import('@/views/CertificateDetailView.vue'),
    meta: { title: '学习证书' },
  },
  {
    path: '/mine/settings',
    name: 'mine-settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: '关于我们' },
  },
  {
    path: '/disclaimer',
    name: 'disclaimer',
    component: () => import('@/views/DisclaimerView.vue'),
    meta: { title: '免责声明' },
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@/views/PrivacyView.vue'),
    meta: { title: '隐私政策' },
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('@/views/TermsView.vue'),
    meta: { title: '用户协议' },
  },
  // 兜底
  { path: '/:pathMatch(.*)*', redirect: '/home' },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const title = (to.meta.title as string) || '韭菜学院';
  document.title = title === '首页' ? '韭菜学院' : `${title} · 韭菜学院`;
});

export default router;
