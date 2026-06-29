async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  const json = await res.json() as { success: true; data: T } | { success: false; error: { code: string; message: string } };
  if (!json.success) throw new Error(json.error.message);
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
  del: <T>(url: string) => req<T>(url, { method: 'DELETE' }),
};
