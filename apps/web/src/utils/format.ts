/**
 * 通用格式化工具：金额、时长、时间、域名、截断、匿名昵称
 */
import { ANONYMOUS_NICKNAME_PREFIX, ANONYMOUS_SUFFIX_POOL } from '@jiucaibox/shared';

/** 金额格式化：12345 -> ¥12,345 */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '';
  return `¥${amount.toLocaleString('zh-CN')}`;
}

/** 秒 -> mm:ss 或 h:mm:ss */
export function formatDuration(seconds: number | undefined | null): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** ISO 时间 -> YYYY-MM-DD HH:mm */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** 相对时间：刚刚 / X 分钟前 / X 小时前 / X 天前 / 日期 */
export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return formatDateTime(iso);
}

/** 从链接提取域名（去掉 www.），失败返回原文截断 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return url.slice(0, 40);
  }
}

/** 文本截断 */
export function truncate(text: string, max = 100): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 生成随机匿名昵称，如：韭菜A3K */
export function randomNickname(): string {
  const pool = ANONYMOUS_SUFFIX_POOL;
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += pool[Math.floor(Math.random() * pool.length)];
  }
  return `${ANONYMOUS_NICKNAME_PREFIX}${suffix}`;
}

/** 用 id 稳定生成一个 emoji 头像（8 款防割主题） */
const AVATAR_EMOJIS = ['🛡️', '🌿', '💧', '📖', '🧭', '🤝', '🔍', '🌟'];

export function emojiAvatar(seed: number | string | undefined): string {
  const n = typeof seed === 'number' ? seed : Number(String(seed).length) || 0;
  return AVATAR_EMOJIS[Math.abs(n) % AVATAR_EMOJIS.length];
}
