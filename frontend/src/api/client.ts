const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, body.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

async function mutate<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
  const hasBody = body !== undefined;

  const response = await fetch(url.toString(), {
    method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, errorBody.detail || `HTTP ${response.status}`);
  }

  // 204 No Content — return void safely
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | undefined>) =>
    request<T>(endpoint, params),

  post: <T>(endpoint: string, body?: unknown) =>
    mutate<T>('POST', endpoint, body),

  put: <T>(endpoint: string, body?: unknown) =>
    mutate<T>('PUT', endpoint, body),

  patch: <T>(endpoint: string, body?: unknown) =>
    mutate<T>('PATCH', endpoint, body),

  delete: <T = void>(endpoint: string) =>
    mutate<T>('DELETE', endpoint),
};
