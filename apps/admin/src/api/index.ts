import { http } from '@/utils/request';
import type {
  AdminUser,
  CourseItem,
  DashboardData,
  DeepFeedbackItem,
  PageResult,
  PopupItem,
  QuizQuestion,
  RadioEpisode,
  RadioTrick,
  RiskLevel,
  RiskWord,
  StatsOverview,
  StoryComment,
  StoryItem,
  VideoItem,
} from '@jiucaibox/shared';

// ==================== 后台扩展类型（后端返回，shared 未覆盖的字段） ====================

export interface AdminLoginResult {
  token: string;
  admin: AdminUser;
}

/** 课程列表行：列表接口返回 */
export interface AdminCourseRow extends CourseItem {
  sort: number;
  quizCount: number;
}

/** 课程详情中的视频（含弹窗） */
export interface AdminVideoItem extends VideoItem {
  popup: PopupItem | null;
}

/** 课程详情：列表 + videos + quizQuestions 全量 */
export interface AdminCourseDetail extends CourseItem {
  sort: number;
  videos: AdminVideoItem[];
  quizQuestions: QuizQuestion[];
}

/** AI 测评结果（aiResult JSON 的可视化结构） */
export interface AiResult {
  riskPoints: { type: string; evidence: string; count: number }[];
  dimensions: { name: string; score: number }[];
  analysis: string;
  recommendation: string;
}

/** 测评列表行 */
export interface AdminAnalysisRow {
  id: number;
  userId: number | null;
  userNickname: string;
  sourceUrl: string;
  sourceType: string;
  inputText: string;
  riskLevel: RiskLevel | null;
  status: 'pending' | 'done' | 'failed';
  reviewed: boolean;
  reviewerNote: string;
  createdAt: string;
}

/** 测评详情 */
export interface AdminAnalysisDetail extends AdminAnalysisRow {
  failReason?: string;
  aiResult: AiResult | null;
  deepFeedback: DeepFeedbackItem[] | null;
  deepRiskLevel: RiskLevel | null;
  reviewedBy?: string;
}

/** 故事列表行（含审核字段） */
export interface AdminStoryRow extends StoryItem {
  userId: number;
  rejectReason: string;
}

/** 故事详情（含评论） */
export interface AdminStoryDetail extends AdminStoryRow {
  comments: StoryComment[];
}

/** 评论列表行 */
export interface AdminCommentRow {
  id: number;
  storyId: number;
  storyTitle: string;
  userNickname: string;
  content: string;
  createdAt: string;
}

/** 用户列表行 */
export interface AdminUserRow {
  id: number;
  nickname: string;
  avatar: string;
  phone?: string;
  isAnonymous: boolean;
  createdAt: string;
  lastActiveAt?: string;
  status: 'active' | 'banned';
  courseCount: number;
  analysisCount: number;
  storyCount: number;
}

/** 用户详情（学习记录 / 测评历史 / 故事历史） */
export interface AdminUserDetail {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  phone?: string;
  isAnonymous: boolean;
  status: 'active' | 'banned';
  createdAt: string;
  lastActiveAt?: string;
  learning: {
    recordId: number;
    videoId: number;
    videoTitle: string;
    courseId: number;
    watchedSeconds: number;
    updatedAt: string;
  }[];
  analysis: {
    id: number;
    sourceUrl: string;
    riskLevel: RiskLevel | null;
    status: string;
    createdAt: string;
  }[];
  stories: { id: number; title: string; status: string; createdAt: string }[];
}

/** 操作日志行 */
export interface OperationLogRow {
  id: number;
  adminId: number | null;
  adminName: string;
  action: string;
  target?: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

// ==================== 请求体类型 ====================

export interface VideoPayload {
  courseId: number;
  title: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  description: string;
  order: number;
}

export interface QuizPayload {
  courseId: number;
  chapter: number;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface RadioPayload {
  title: string;
  sourceUrl: string;
  sourceLabel: string;
  coverUrl: string;
  summary: string;
  tricks: RadioTrick[];
  warning: string;
  relatedCourseId: number | null;
}

export interface LexiconPayload {
  word: string;
  category: string;
  weight: number;
}

export interface ReviewPayload {
  riskLevel?: RiskLevel;
  note?: string;
}

export interface OkResult {
  ok: boolean;
}

// ==================== 接口函数 ====================

// ---------- 登录 ----------
export const adminLogin = (username: string, password: string) =>
  http<AdminLoginResult>({ method: 'post', url: '/api/admin/login', data: { username, password } });

// ---------- 仪表盘 ----------
export const fetchDashboard = () => http<DashboardData>({ method: 'get', url: '/api/admin/dashboard' });

// ---------- 课程 ----------
export const fetchCourses = (params: {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}) => http<PageResult<AdminCourseRow>>({ method: 'get', url: '/api/admin/courses', params });

export const fetchCourseDetail = (id: number) =>
  http<AdminCourseDetail>({ method: 'get', url: `/api/admin/courses/${id}` });

export const createCourse = (data: { title: string; description: string; coverUrl: string; category: string; learnerCount: number; sort: number }) =>
  http<CourseItem>({ method: 'post', url: '/api/admin/courses', data });

export const updateCourse = (id: number, data: Partial<{ title: string; description: string; coverUrl: string; category: string; learnerCount: number; sort: number }>) =>
  http<CourseItem>({ method: 'put', url: `/api/admin/courses/${id}`, data });

export const deleteCourse = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/courses/${id}` });

// ---------- 视频 ----------
export const createVideo = (data: VideoPayload) =>
  http<VideoItem>({ method: 'post', url: '/api/admin/videos', data });

export const updateVideo = (id: number, data: Partial<VideoPayload>) =>
  http<VideoItem>({ method: 'put', url: `/api/admin/videos/${id}`, data });

export const deleteVideo = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/videos/${id}` });

// ---------- 真相弹窗 ----------
export const upsertPopup = (videoId: number, content: string) =>
  http<PopupItem>({ method: 'post', url: '/api/admin/popups', data: { videoId, content } });

// ---------- 测试题 ----------
export const createQuiz = (data: QuizPayload) =>
  http<QuizQuestion>({ method: 'post', url: '/api/admin/quiz', data });

export const updateQuiz = (id: number, data: Partial<QuizPayload>) =>
  http<QuizQuestion>({ method: 'put', url: `/api/admin/quiz/${id}`, data });

export const deleteQuiz = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/quiz/${id}` });

// ---------- 测评 ----------
export const fetchAnalysisList = (params: { page?: number; pageSize?: number; status?: string; riskLevel?: string }) =>
  http<PageResult<AdminAnalysisRow>>({ method: 'get', url: '/api/admin/analysis', params });

export const fetchAnalysisDetail = (id: number) =>
  http<AdminAnalysisDetail>({ method: 'get', url: `/api/admin/analysis/${id}` });

export const reviewAnalysis = (id: number, data: ReviewPayload) =>
  http<AdminAnalysisDetail>({ method: 'put', url: `/api/admin/analysis/${id}/review`, data });

export const rerunAnalysis = (id: number) =>
  http<{ ok: boolean; message: string }>({ method: 'post', url: `/api/admin/analysis/${id}/rerun` });

// ---------- 故事 ----------
export const fetchStories = (params: { page?: number; pageSize?: number; status?: string }) =>
  http<PageResult<AdminStoryRow>>({ method: 'get', url: '/api/admin/stories', params });

export const fetchStoryDetail = (id: number) =>
  http<AdminStoryDetail>({ method: 'get', url: `/api/admin/stories/${id}` });

export const approveStory = (id: number) =>
  http<StoryItem>({ method: 'post', url: `/api/admin/stories/${id}/approve` });

export const rejectStory = (id: number, reason: string) =>
  http<StoryItem>({ method: 'post', url: `/api/admin/stories/${id}/reject`, data: { reason } });

export const deleteStory = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/stories/${id}` });

// ---------- 评论 ----------
export const fetchComments = (params: { storyId?: number; page?: number; pageSize?: number }) =>
  http<PageResult<AdminCommentRow>>({ method: 'get', url: '/api/admin/comments', params });

export const deleteComment = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/comments/${id}` });

// ---------- 电台 ----------
export const fetchRadioList = (params: { page?: number; pageSize?: number }) =>
  http<PageResult<RadioEpisode>>({ method: 'get', url: '/api/admin/radio', params });

export const createRadio = (data: RadioPayload) =>
  http<RadioEpisode>({ method: 'post', url: '/api/admin/radio', data });

export const updateRadio = (id: number, data: Partial<RadioPayload>) =>
  http<RadioEpisode>({ method: 'put', url: `/api/admin/radio/${id}`, data });

export const deleteRadio = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/radio/${id}` });

// ---------- 用户 ----------
export const fetchUsers = (params: { page?: number; pageSize?: number; search?: string; status?: string }) =>
  http<PageResult<AdminUserRow>>({ method: 'get', url: '/api/admin/users', params });

export const fetchUserDetail = (id: number) =>
  http<AdminUserDetail>({ method: 'get', url: `/api/admin/users/${id}` });

export const setUserBan = (id: number, banned: boolean) =>
  http<{ ok: boolean; status: string }>({ method: 'put', url: `/api/admin/users/${id}/ban`, data: { banned } });

/** 重置某条学习记录（清除误报 watchedSeconds；若关联课程已发证书则一并撤销） */
export const resetLearningRecord = (recordId: number) =>
  http<{ ok: boolean; certificateRevoked: boolean }>({
    method: 'post',
    url: `/api/admin/learning-records/${recordId}/reset`,
  });

// ---------- 风险词库 ----------
export const fetchLexicon = () => http<RiskWord[]>({ method: 'get', url: '/api/admin/lexicon' });

export const createLexiconWord = (data: LexiconPayload) =>
  http<RiskWord>({ method: 'post', url: '/api/admin/lexicon', data });

export const updateLexiconWord = (id: number, data: Partial<LexiconPayload> & { active?: boolean }) =>
  http<RiskWord>({ method: 'put', url: `/api/admin/lexicon/${id}`, data });

export const deleteLexiconWord = (id: number) =>
  http<OkResult>({ method: 'delete', url: `/api/admin/lexicon/${id}` });

// ---------- 统计 ----------
export const fetchStatsOverview = () => http<StatsOverview>({ method: 'get', url: '/api/admin/stats/overview' });

// ---------- 操作日志 ----------
export const fetchLogs = (limit = 100) =>
  http<OperationLogRow[]>({ method: 'get', url: '/api/admin/logs', params: { limit } });
