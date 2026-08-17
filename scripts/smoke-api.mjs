/**
 * 韭菜学院 API 冒烟测试脚本
 * 用法: 先启动后端 (npm run dev:api 或 node apps/api/dist/main.js)，再执行:
 *   node scripts/smoke-api.mjs [baseUrl]
 * 默认 baseUrl = http://localhost:3000
 */
const BASE = process.argv[2] || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures = [];

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function main() {
  console.log(`\n🧪 韭菜学院 API 冒烟测试  base=${BASE}\n`);

  // 1. 健康检查
  const health = await req('GET', '/api/health');
  check('GET /api/health', health.status === 200 && health.data?.status === 'ok');

  // 2. 手机号登录
  const login = await req('POST', '/api/auth/phone', { phone: '13800138000', code: '123456' });
  check('POST /api/auth/phone', login.status === 201 && !!login.data?.token, JSON.stringify(login.data));
  const token = login.data?.token;

  // 3. 首页聚合
  const home = await req('GET', '/api/home');
  check('GET /api/home', home.status === 200 && Array.isArray(home.data?.featuredCourses) && home.data?.featuredCourses.length > 0, JSON.stringify(home.data?.featuredCourses?.length));

  // 4. 课程列表与详情
  const courses = await req('GET', '/api/courses');
  check('GET /api/courses', courses.status === 200 && courses.data?.list?.length > 0);
  const courseId = courses.data?.list?.[0]?.id;
  const detail = await req('GET', `/api/courses/${courseId}`);
  check('GET /api/courses/:id', detail.status === 200 && detail.data?.videos?.length > 0, `courseId=${courseId}`);

  // 5. 真相弹窗
  const videoId = detail.data?.videos?.[0]?.id;
  const popup = await req('GET', `/api/popup/${videoId}`);
  check('GET /api/popup/:videoId', popup.status === 200 && !!popup.data?.content, JSON.stringify(popup.data));

  // 6. 学习记录
  const watched = await req('POST', `/api/videos/${videoId}/watched`, {}, token);
  check('POST /api/videos/:id/watched', watched.status === 201);

  // 7. 校准测试
  const quiz = await req('GET', `/api/courses/${courseId}/quiz`);
  check('GET /api/courses/:id/quiz', quiz.status === 200 && quiz.data?.length > 0, JSON.stringify(quiz.data?.length));
  if (quiz.data?.length) {
    const q = quiz.data[0];
    const answer = await req('POST', `/api/quiz/${q.id}/answer`, { answer: q.correctOption }, token);
    check('POST /api/quiz/:id/answer', answer.status === 201 && answer.data?.correct === true);
  }

  // 8. 测评提交（异步分析）
  const analysis = await req(
    'POST',
    '/api/analysis',
    {
      sourceUrl: 'https://example.com/课程',
      sourceType: 'video',
      inputText: '月入过万不是梦！最后3天名额有限，学员反馈日赚500，保本稳赚，先交定金锁定名额，支持贷款分期！',
    },
    token,
  );
  check('POST /api/analysis', analysis.status === 201 && !!analysis.data?.id, JSON.stringify(analysis.data));
  const reportId = analysis.data?.id;

  // 9. 轮询报告结果
  let report = null;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const res = await req('GET', `/api/analysis/${reportId}`, null, token);
    if (res.data?.status === 'done' || res.data?.status === 'failed') {
      report = res.data;
      break;
    }
  }
  check('GET /api/analysis/:id (done)', report?.status === 'done' && report?.riskLevel === 'high', JSON.stringify(report?.status + '/' + report?.riskLevel));

  // 10. 深度接洽
  const deep = await req(
    'POST',
    `/api/analysis/${reportId}/deep`,
    {
      feedback: [
        { step: 1, question: 'q1', answer: 'yes' },
        { step: 2, question: 'q2', answer: 'no' },
        { step: 3, question: 'q3', answer: 'yes' },
        { step: 4, question: 'q4', answer: 'no' },
        { step: 5, question: 'q5', answer: 'unsure' },
        { step: 6, question: 'q6', answer: 'no' },
      ],
    },
    token,
  );
  check('POST /api/analysis/:id/deep', deep.status === 201 && deep.data?.deepAlert === true, JSON.stringify(deep.data?.deepRiskLevel + '/' + deep.data?.deepAlert));

  // 11. 故事社区
  const stories = await req('GET', '/api/stories');
  check('GET /api/stories', stories.status === 200 && stories.data?.list?.length > 0);
  const storyId = stories.data?.list?.[0]?.id;
  const hug = await req('POST', `/api/stories/${storyId}/hug`, {}, token);
  check('POST /api/stories/:id/hug', hug.status === 201 && hug.data?.hugCount >= 1);

  const comment = await req('POST', `/api/stories/${storyId}/comments`, { content: '抱抱你，谢谢分享！' }, token);
  check('POST /api/stories/:id/comments', comment.status === 201);

  const submitStory = await req(
    'POST',
    '/api/stories',
    {
      category: 'live',
      lossAmount: 5000,
      lossTypes: ['money', 'time'],
      title: '冒烟测试故事',
      content: '这是一条冒烟测试用的故事内容，讲述一次被割经历与教训，长度满足要求。',
      lesson: '测试教训',
    },
    token,
  );
  check('POST /api/stories', submitStory.status === 201 && submitStory.data?.status === 'pending');

  // 12. 电台
  const radio = await req('GET', '/api/radio');
  check('GET /api/radio', radio.status === 200 && radio.data?.list?.length > 0);

  // 13. 用户中心
  const profile = await req('GET', '/api/user/profile', null, token);
  check('GET /api/user/profile', profile.status === 200 && profile.data?.stats?.analysisCount >= 1, JSON.stringify(profile.data?.stats));
  const learning = await req('GET', '/api/user/learning', null, token);
  check('GET /api/user/learning', learning.status === 200 && learning.data?.stats?.videoCount >= 1);
  const notifications = await req('GET', '/api/user/notifications', null, token);
  check('GET /api/user/notifications', notifications.status === 200);

  // 14. 管理后台
  const adminLogin = await req('POST', '/admin/login', { username: 'admin', password: 'jiucai123456' });
  check('POST /admin/login', adminLogin.status === 201 && !!adminLogin.data?.token, JSON.stringify(adminLogin.data));
  const adminToken = adminLogin.data?.token;
  const dashboard = await req('GET', '/admin/dashboard', null, adminToken);
  check('GET /admin/dashboard', dashboard.status === 200 && dashboard.data?.today?.pendingStories >= 1, JSON.stringify(dashboard.data?.today));

  // 15. 后台故事审核（通过冒烟测试提交的故事）
  const pendingStories = await req('GET', '/admin/stories?status=pending', null, adminToken);
  check('GET /admin/stories', pendingStories.status === 200);
  if (pendingStories.data?.list?.length) {
    const target = pendingStories.data.list.find((s) => s.title === '冒烟测试故事') || pendingStories.data.list[0];
    const approve = await req('POST', `/admin/stories/${target.id}/approve`, {}, adminToken);
    check('POST /admin/stories/:id/approve', approve.status === 201 && approve.data?.status === 'approved');
  }

  // 16. 后台测评复核 + 用户 + 词库 + 统计
  const analysisAdmin = await req('GET', '/admin/analysis?status=done', null, adminToken);
  check('GET /admin/analysis', analysisAdmin.status === 200 && analysisAdmin.data?.list?.length >= 1);
  const users = await req('GET', '/admin/users?search=13800138000', null, adminToken);
  check('GET /admin/users', users.status === 200 && users.data?.list?.length >= 1);
  const lexicon = await req('GET', '/admin/lexicon', null, adminToken);
  check('GET /admin/lexicon', lexicon.status === 200 && lexicon.data?.length >= 10);
  const stats = await req('GET', '/admin/stats/overview', null, adminToken);
  check('GET /admin/stats/overview', stats.status === 200 && Array.isArray(stats.data?.userGrowth));

  console.log(`\n${passed} 通过 / ${failed} 失败`);
  if (failed > 0) {
    console.log('失败项:', failures.join(', '));
    process.exit(1);
  }
  console.log('🎉 冒烟测试全部通过');
}

main().catch((e) => {
  console.error('冒烟测试异常:', e);
  process.exit(1);
});
