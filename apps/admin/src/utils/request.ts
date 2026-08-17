import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { message } from 'ant-design-vue';

/** 管理后台 token 存储 key（与后端约定一致） */
export const TOKEN_KEY = 'jiucaibox_admin_token';
/** 管理员信息存储 key */
export const INFO_KEY = 'jiucaibox_admin_info';

/**
 * API baseURL：
 * - 本地开发为空串（同源 /admin/...，由 vite.config.ts 代理到后端 3000）
 * - 生产部署可通过环境变量 VITE_API_BASE 覆盖为后端完整地址，例如：
 *   VITE_API_BASE=https://api.jiucaibox.example.com
 */
const baseURL = import.meta.env.VITE_API_BASE || '';

const request = axios.create({
  baseURL,
  timeout: 15000,
});

// 请求拦截器：附加 Bearer token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 从 NestJS 错误响应中提取可读的中文错误信息 */
function extractErrorMessage(error: unknown): string {
  const data = (error as AxiosError)?.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined;
  if (!data) return '网络异常，请稍后重试';
  if (typeof data.message === 'string' && data.message) return data.message;
  if (Array.isArray(data.message) && data.message.length) return data.message.join('；');
  if (typeof data.error === 'string' && data.error) return data.error;
  return '请求失败，请稍后重试';
}

// 响应拦截器：直接返回业务数据；统一错误提示
request.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      // 登录接口本身的 401（账号密码错误）留在登录页提示原始信息
      if (window.location.pathname === '/login') {
        message.error(extractErrorMessage(error));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(INFO_KEY);
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      message.error('无权限操作');
    } else if (status === 404) {
      message.error('请求的资源不存在');
    } else {
      message.error(extractErrorMessage(error));
    }
    return Promise.reject(error);
  },
);

/** 类型化请求助手：resolve 值为后端返回的业务数据 */
export function http<T>(config: AxiosRequestConfig): Promise<T> {
  return request(config) as Promise<T>;
}

export default request;
