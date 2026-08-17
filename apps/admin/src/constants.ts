import type { AdminRole } from '@jiucaibox/shared';

/** 后台角色中文名 */
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  content_ops: '内容运营',
  reviewer: '审核专员',
  support: '客服/运营支持',
  analyst: '数据分析',
};

/** 测评状态 */
export const ANALYSIS_STATUS_LABELS: Record<string, string> = {
  pending: '分析中',
  done: '已完成',
  failed: '失败',
  reviewed: '已复核',
};

export const ANALYSIS_STATUS_COLORS: Record<string, string> = {
  pending: 'processing',
  done: 'success',
  failed: 'error',
  reviewed: 'default',
};

/** 故事状态 */
export const STORY_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  approved: '已发布',
  rejected: '已驳回',
};

export const STORY_STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

/** 用户状态 */
export const USER_STATUS_LABELS: Record<string, string> = {
  active: '正常',
  banned: '已封禁',
};

export const USER_STATUS_COLORS: Record<string, string> = {
  active: 'success',
  banned: 'error',
};

/** 深度接洽反馈答案中文 */
export const DEEP_ANSWER_LABELS: Record<string, string> = {
  yes: '是',
  no: '否',
  unsure: '不确定',
};
