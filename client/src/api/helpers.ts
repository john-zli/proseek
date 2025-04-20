const API_BASE = '/api';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request<T>(endpoint: string, method: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'GET', options);
  },

  post: <T>(endpoint: string, body: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'POST', { ...options, body });
  },

  put: <T>(endpoint: string, body: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'PUT', { ...options, body });
  },

  delete: <T>(endpoint: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'DELETE', options);
  },

  patch: <T>(endpoint: string, body: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<T> => {
    return request<T>(endpoint, 'PATCH', { ...options, body });
  },
};
