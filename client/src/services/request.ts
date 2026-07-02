import { message } from 'antd';

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
      ...options,
    });
  } catch {
    message.error('网络请求失败，请检查连接');
    throw new Error('network error');
  }
  const json = await res.json() as { success: true; data: T } | { success: false; error: { code: string; message: string } };
  if (!json.success) {
    message.error(json.error.message);
    throw new Error(json.error.message);
  }
  return json.data;
}

export const http = {
  get: <T>(url: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<T>(url + qs);
  },
  post: <T>(url: string, data: unknown) =>
    req<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) =>
    req<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    req<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  del: <T>(url: string, data?: unknown) =>
    req<T>(url, { method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
};
