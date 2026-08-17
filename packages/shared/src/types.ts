/**
 * 韭菜学院 / JiucaiBox 共享类型定义
 * 三端（H5 / API / Admin）统一使用的数据类型，保持前后端契约一致。
 */

// ---------- 通用 ----------
export type RiskLevel = 'high' | 'medium' | 'low';
export type RiskStatus = 'pending' | 'done' | 'failed';
export type SourceType = 'video' | 'article' | 'other';

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- 用户 ----------
export interface UserProfile {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  isAnonymous: boolean;
  phone?: string;
  createdAt: string;
  lastActiveAt?: string;
  stats?: {
    courseCount: number;
    analysisCount: number;
    storyCount: number;
  };
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

// ---------- 课程/视频 ----------
export type CourseCategory = 'live' | 'finance' | 'franchise' | 'experience' | 'truth' | 'other';

/** 课程难度 */
export type CourseDifficulty = 'entry' | 'intermediate' | 'advanced';

/** 适用人群 */
export type TargetAudience =
  | 'all'         // 全人群
  | 'newcomer'    // 刚毕业 / 初入社会
  | 'parent'      // 家长
  | 'founder'     // 创业者
  | 'senior';     // 老年人 / 为家中老人

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  live: '直播行业真相课',
  finance: '韭菜财商学院',
  franchise: '韭菜致富营',
  experience: '韭菜体验营',
  truth: '真相课',
  other: '其他',
};

export const COURSE_DIFFICULTY_LABELS: Record<CourseDifficulty, string> = {
  entry: '入门',
  intermediate: '进阶',
  advanced: '深度',
};

export const COURSE_DIFFICULTY_COLORS: Record<CourseDifficulty, string> = {
  entry: '#4CAF50',        // 绿
  intermediate: '#FF9800', // 橙
  advanced: '#F44336',     // 红
};

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all: '全人群',
  newcomer: '应届毕业生',
  parent: '家长',
  founder: '创业者',
  senior: '中老年',
};

export interface VideoItem {
  id: number;
  courseId: number;
  title: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  description: string;
  order: number;
  watched?: boolean;
}

export interface CourseItem {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  category: CourseCategory;
  isFree: boolean;
  learnerCount: number;
  createdAt: string;
  videoCount?: number;
  learnedCount?: number;
  progress?: number; // 0-100
  // —— 教学化画像 ——
  difficulty?: CourseDifficulty;
  targetAudience?: TargetAudience;
  estimatedMinutes?: number;
  summary?: string;
  outcomes?: string[];
  warningTips?: string[];
  updatedAt?: string;
}

export interface CourseDetail extends CourseItem {
  videos: VideoItem[];
}

export interface QuizQuestion {
  id: number;
  courseId: number;
  chapter: number;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface PopupItem {
  id: number;
  videoId: number;
  content: string;
}

// ---------- 测评 ----------
export interface RiskPoint {
  type: string;
  evidence: string;
  count: number;
}

export interface RiskDimension {
  name: string;
  score: number; // 0-100
}

export interface DeepFeedbackItem {
  step: number;
  question: string;
  answer: 'yes' | 'no' | 'unsure';
}

export interface AnalysisReport {
  id: number;
  sourceUrl: string;
  sourceType: SourceType;
  inputText: string;
  riskLevel: RiskLevel | null;
  status: RiskStatus;
  riskPoints: RiskPoint[];
  dimensions: RiskDimension[];
  analysis: string;
  recommendation: string;
  deepFeedback: DeepFeedbackItem[] | null;
  deepRiskLevel?: RiskLevel | null;
  createdAt: string;
  failReason?: string;
}

export interface DeepStep {
  step: number;
  question: string;
  highRisk?: boolean;
}

// ---------- 韭菜的泪花 ----------
export type StoryStatus = 'pending' | 'approved' | 'rejected';
export type StoryCategory = 'live' | 'finance' | 'franchise' | 'other';
export type LossType = 'money' | 'time' | 'mental' | 'family';

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  live: '直播培训',
  finance: '财商课程',
  franchise: '招商加盟',
  other: '其他',
};

export const LOSS_TYPE_LABELS: Record<LossType, string> = {
  money: '金钱',
  time: '时间',
  mental: '心理',
  family: '家庭矛盾',
};

export interface StoryComment {
  id: number;
  storyId: number;
  userNickname: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
}

export interface StoryItem {
  id: number;
  userNickname: string;
  category: StoryCategory;
  lossAmount: number | null;
  lossTypes: LossType[];
  title: string;
  content: string;
  lesson: string;
  images: string[];
  status: StoryStatus;
  hugCount: number;
  commentCount: number;
  createdAt: string;
  hugged?: boolean;
  rejectReason?: string;
}

// ---------- 韭菜电台 ----------
export interface RadioTrick {
  name: string;
  description: string;
}

export interface RadioEpisode {
  id: number;
  title: string;
  sourceUrl: string;
  sourceLabel: string;
  coverUrl?: string;
  summary: string;
  tricks: RadioTrick[];
  warning: string;
  relatedCourseId: number | null;
  relatedCourseTitle?: string;
  createdAt: string;
}

// ---------- 通知 ----------
export interface AppNotification {
  id: number;
  type: 'system' | 'review' | 'interaction' | 'cert_issued';
  title: string;
  content: string;
  /** 课程完成证书专用：关联课程 ID */
  courseId?: number;
  read: boolean;
  createdAt: string;
}

/**
 * 课程完成证书元数据。
 * certId = AppNotification.id（颁发通知的 ID），可作为防伪/查询 key。
 * pdfUrl 当前未实现真实 PDF 生成，预留字段以便后续接入 CDN/OSS。
 */
export interface Certificate {
  certId: number;
  courseId: number;
  courseTitle: string;
  userId: number;
  userNickname: string;
  issuedAt: string;
  pdfUrl?: string | null;
}

// ---------- 学习记录 ----------
export interface LearningRecord {
  courseId: number;
  courseTitle: string;
  coverUrl: string;
  learnedCount: number;
  totalCount: number;
  progress: number;
  lastVideoId?: number | null;
  updatedAt: string;
}

export interface LearningStats {
  courseCount: number;
  videoCount: number;
  totalSeconds: number;
}

// ---------- 首页聚合 ----------
export interface HomeData {
  banner: { title: string; url: string } | null;
  featuredCourses: CourseItem[];
  latestStories: StoryItem[];
  latestRadio: RadioEpisode | null;
}

// ---------- 管理后台 ----------
export type AdminRole = 'super_admin' | 'content_ops' | 'reviewer' | 'support' | 'analyst';

export interface AdminUser {
  id: number;
  username: string;
  role: AdminRole;
  nickname: string;
  createdAt: string;
}

export interface DashboardData {
  today: {
    newUsers: number;
    analysisCount: number;
    pendingStories: number;
    completedVideos: number;
  };
  riskDistribution: { level: RiskLevel; count: number }[];
  pendingReviews: number;
  recentStories: StoryItem[];
}

export interface RiskWord {
  id: number;
  word: string;
  category: string;
  weight: number;
  active: boolean;
}

export interface TrickTag {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  relatedCategory?: string;
}

export interface UserAdminRow {
  id: number;
  nickname: string;
  avatar: string;
  phone?: string;
  createdAt: string;
  lastActiveAt?: string;
  status: 'active' | 'banned';
  courseCount: number;
  analysisCount: number;
  storyCount: number;
}

export interface StatsOverview {
  userGrowth: { date: string; count: number }[];
  analysisTrend: { date: string; count: number }[];
  storyTrend: { date: string; count: number }[];
  riskRatio: { level: RiskLevel; count: number }[];
  topRiskTypes: { type: string; count: number }[];
  /**
   * 课程完课率。
   * completionRate：
   *  - 0-100：实际完课率 = 已覆盖全部视频的用户课程对数 / 有学习记录的用户课程对数 × 100
   *  - -1：该课程暂无任何学习记录（前端应展示「暂无数据」）
   */
  courseCompletion: { title: string; completionRate: number }[];
}
