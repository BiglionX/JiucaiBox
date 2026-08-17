/**
 * API 层：按 @jiucaibox/shared 契约封装全部后端接口
 * 所有请求经由 src/utils/request.ts
 */
import {
  type AnalysisReport,
  type AppNotification,
  type Certificate,
  type CourseCategory,
  type CourseDetail,
  type CourseItem,
  type DeepFeedbackItem,
  type HomeData,
  type LearningRecord,
  type LearningStats,
  type LoginResponse,
  type PageQuery,
  type PageResult,
  type PopupItem,
  type QuizQuestion,
  type RadioEpisode,
  type RiskStatus,
  type SourceType,
  type StoryCategory,
  type StoryComment,
  type StoryItem,
  type UserProfile,
} from '@jiucaibox/shared';
import { del, get, post, put } from '@/utils/request';

// ==================== 局部补充类型（后端返回但共享包未覆盖的字段） ====================

export interface UpdateProfilePayload {
  nickname?: string;
  avatar?: string;
  bio?: string;
}

export interface CreateAnalysisPayload {
  sourceUrl?: string;
  sourceType?: SourceType;
  inputText?: string;
}

/** GET /api/user/learning 返回结构 */
export interface UserLearningData {
  stats: LearningStats;
  records: LearningRecord[];
}

export interface MyCommentItem {
  id: number;
  content: string;
  storyId: number;
  storyTitle: string;
  createdAt: string;
}

export interface MyHugItem {
  id: number;
  storyId: number;
  storyTitle: string;
  createdAt: string;
}

/** GET /api/user/interactions 返回结构 */
export interface UserInteractions {
  comments: MyCommentItem[];
  hugs: MyHugItem[];
}

/** POST /api/quiz/:questionId/answer 返回结构 */
export interface QuizAnswerResult {
  correct: boolean;
  correctOption: number;
  explanation?: string;
  [key: string]: unknown;
}

/** POST /api/analysis/:id/deep 返回结构（在报告基础上追加深度评估字段） */
export interface DeepResult extends AnalysisReport {
  deepAlert?: string;
  deepSummary?: string;
}

// ==================== 认证 ====================

export interface LoginPayload {
  phone: string;
  code?: string;
}

export const authApi = {
  /** 手机号验证码登录/注册 */
  loginByPhone(payload: LoginPayload): Promise<LoginResponse> {
    return post<LoginResponse>('/auth/phone', payload);
  },

  /** 微信登录（MVP：openid 传空字符串即可） */
  wechatLogin(payload: { openid?: string; code?: string; nickname?: string }): Promise<LoginResponse> {
    return post<LoginResponse>('/auth/wechat', payload);
  },

  /** 退出登录（无状态，前端清 token 即可） */
  logout(): Promise<{ ok: boolean }> {
    return post<{ ok: boolean }>('/auth/logout');
  },
};

// ==================== 用户中心 ====================

export const userApi = {
  getProfile(): Promise<UserProfile> {
    return get<UserProfile>('/user/profile');
  },

  updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    return put<UserProfile>('/user/profile', payload);
  },

  getLearning(): Promise<UserLearningData> {
    return get<UserLearningData>('/user/learning');
  },

  getMyAnalysis(query: PageQuery = {}): Promise<PageResult<AnalysisReport>> {
    return get<PageResult<AnalysisReport>>('/user/analysis', { ...query });
  },

  getMyStories(): Promise<StoryItem[]> {
    return get<StoryItem[]>('/user/stories');
  },

  getInteractions(): Promise<UserInteractions> {
    return get<UserInteractions>('/user/interactions');
  },

  getNotifications(): Promise<AppNotification[]> {
    return get<AppNotification[]>('/user/notifications');
  },

  getCertificates(): Promise<Certificate[]> {
    return get<Certificate[]>('/user/certificates');
  },

  getCertificateDetail(id: number | string): Promise<Certificate> {
    return get<Certificate>(`/user/certificates/${id}`);
  },

  markNotificationsRead(ids: number[]): Promise<unknown> {
    return post<unknown>('/user/notifications/read', { ids });
  },

  markAllNotificationsRead(): Promise<unknown> {
    return post<unknown>('/user/notifications/read-all');
  },

  clearLearning(): Promise<unknown> {
    return post<unknown>('/user/clear-learning');
  },

  deleteAccount(): Promise<unknown> {
    return del<unknown>('/user/account');
  },
};

// ==================== 首页聚合 ====================

export const homeApi = {
  getHome(): Promise<HomeData> {
    return get<HomeData>('/home');
  },
};

// ==================== 课程 ====================

export interface CourseQuery extends PageQuery {
  category?: CourseCategory;
  search?: string;
}

export const courseApi = {
  getCourses(query: CourseQuery = {}): Promise<PageResult<CourseItem>> {
    return get<PageResult<CourseItem>>('/courses', { ...query });
  },

  getCourseDetail(id: number | string): Promise<CourseDetail> {
    return get<CourseDetail>(`/courses/${id}`);
  },

  /** 标记视频已学（需登录）。可选传入已观看秒数（内嵌播放器心跳场景） */
  markWatched(
    videoId: number,
    watchedSeconds?: number,
  ): Promise<{ ok: boolean; completed: boolean; watchedSeconds: number }> {
    return post<{ ok: boolean; completed: boolean; watchedSeconds: number }>(
      `/videos/${videoId}/watched`,
      typeof watchedSeconds === 'number' ? { watchedSeconds } : undefined,
    );
  },

  /** 获取视频真相弹窗内容；视频无配置时后端返回 404（skipErrorToast 静默） */
  getPopup(videoId: number): Promise<PopupItem> {
    return get<PopupItem>(`/popup/${videoId}`, undefined, {
      skipErrorToast: true,
    });
  },

  getQuiz(courseId: number | string, chapter?: number): Promise<QuizQuestion[]> {
    return get<QuizQuestion[]>(`/courses/${courseId}/quiz`, chapter !== undefined ? { chapter } : {});
  },

  submitQuiz(questionId: number, answer: number): Promise<QuizAnswerResult> {
    return post<QuizAnswerResult>(`/quiz/${questionId}/answer`, { answer });
  },
};

// ==================== 测评 ====================

export const analysisApi = {
  create(payload: CreateAnalysisPayload): Promise<AnalysisReport> {
    return post<AnalysisReport>('/analysis', payload);
  },

  getById(id: number | string): Promise<AnalysisReport> {
    return get<AnalysisReport>(`/analysis/${id}`);
  },

  /** 深度接洽流程提交（需登录） */
  submitDeepFeedback(id: number | string, feedback: DeepFeedbackItem[]): Promise<DeepResult> {
    return post<DeepResult>(`/analysis/${id}/deep`, { feedback });
  },
};

// ==================== 韭菜的泪花 ====================

export interface StoryQuery extends PageQuery {
  category?: StoryCategory;
}

export interface CreateStoryPayload {
  category: StoryCategory;
  lossAmount?: number | null;
  lossTypes?: string[];
  title?: string;
  content: string;
  lesson?: string;
  images?: string[];
}

export const storyApi = {
  getStories(query: StoryQuery = {}): Promise<PageResult<StoryItem>> {
    return get<PageResult<StoryItem>>('/stories', { ...query });
  },

  getStoryDetail(id: number | string): Promise<StoryItem> {
    return get<StoryItem>(`/stories/${id}`);
  },

  createStory(payload: CreateStoryPayload): Promise<StoryItem> {
    return post<StoryItem>('/stories', payload);
  },

  hugStory(id: number): Promise<{ ok: boolean }> {
    return post<{ ok: boolean }>(`/stories/${id}/hug`);
  },

  getComments(storyId: number | string): Promise<StoryComment[]> {
    return get<StoryComment[]>(`/stories/${storyId}/comments`);
  },

  addComment(storyId: number | string, content: string): Promise<StoryComment> {
    return post<StoryComment>(`/stories/${storyId}/comments`, { content });
  },

  deleteComment(commentId: number): Promise<{ ok: boolean }> {
    return del<{ ok: boolean }>(`/stories/comment/${commentId}`);
  },
};

// ==================== 韭菜电台 ====================

export const radioApi = {
  getList(query: PageQuery = {}): Promise<PageResult<RadioEpisode>> {
    return get<PageResult<RadioEpisode>>('/radio', { ...query });
  },

  getDetail(id: number | string): Promise<RadioEpisode> {
    return get<RadioEpisode>(`/radio/${id}`);
  },
};

/** 状态文案 */
export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  pending: '分析中',
  done: '已完成',
  failed: '失败',
};
