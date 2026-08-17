import dayjs from 'dayjs';

/** 格式化日期时间：YYYY-MM-DD HH:mm */
export function formatDateTime(value?: string | number | null): string {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

/** 格式化日期：YYYY-MM-DD */
export function formatDate(value?: string | number | null): string {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD');
}

/** 格式化金额 */
export function formatMoney(value?: number | null): string {
  if (value === null || value === undefined) return '-';
  return `¥${value.toLocaleString('zh-CN')}`;
}
