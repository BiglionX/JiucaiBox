/**
 * Axios 封装：统一 baseURL、token 注入、错误提示、401 处理
 * 所有请求必须经由本模块发出。
 */
import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { showToast } from 'vant';

/** 扩展配置：skipErrorToast 用于静默探测类请求（如 popup 404） */
export type RequestOptions = AxiosRequestConfig & { skipErrorToast?: boolean };

export const TOKEN_KEY = 'jiucaibox_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** 401 时的回调（由 user store 注册，用于弹登录框） */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

function extractMessage(err: AxiosError): string {
  const data = err.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined;
  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join('；') : data.message;
  }
  if (data?.error) return data.error;
  if (err.code === 'ECONNABORTED') return '请求超时，请稍后重试';
  if (!err.response) return '网络开小差，请稍后重试';
  return '请求失败，请稍后重试';
}

const instance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

instance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as (AxiosRequestConfig & { skipErrorToast?: boolean }) | undefined;

    if (status === 401) {
      clearToken();
      showToast('请先登录');
      unauthorizedHandler?.();
      return Promise.reject(error);
    }

    // 业务错误统一 toast 提示（可通过 skipErrorToast 静默，如 popup 404 探测）
    if (!config?.skipErrorToast) {
      showToast(extractMessage(error));
    }
    return Promise.reject(error);
  },
);

/** 泛型请求方法：响应体直接返回数据 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return instance.request<any, T>(config);
}

export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  return instance.get<any, T>(url, { params, ...options });
}

export function post<T = unknown>(
  url: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return instance.post<any, T>(url, data, options);
}

export function put<T = unknown>(
  url: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return instance.put<any, T>(url, data, options);
}

export function del<T = unknown>(
  url: string,
  options?: RequestOptions,
): Promise<T> {
  return instance.delete<any, T>(url, options);
}

export default instance;
