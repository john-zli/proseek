const API_BASE = '/admin';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request<T>(endpoint: string, method: string, options: RequestOptions = {}): Promise<T | void> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return;
  }

  if (response.ok) {
    return response.json();
  }

  const error = await response.json();
  throw new Error(error.error);
}

export const api = {
  get: <T>(endpoint: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'GET', options) as Promise<T>;
  },

  post: <T = void>(endpoint: string, body: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'POST', { ...options, body }) as Promise<T>;
  },

  put: <T = void>(endpoint: string, body: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'PUT', { ...options, body }) as Promise<T>;
  },

  delete: <T = void>(endpoint: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'DELETE', options) as Promise<T>;
  },
};
