import { env } from '@/config/env';
import { ApiError, type ApiMetadata, type ApiResponse } from '@/api/contracts';
import { getAccessToken } from '@/api/token-storage';

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${env.apiBaseUrl}${path}`);
  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeMetadata(raw: unknown, fallbackStatus: number): ApiMetadata {
  if (!raw || typeof raw !== 'object') {
    return {
      status_code: fallbackStatus,
      timestamp: new Date().toISOString(),
    };
  }

  const metadata = raw as Partial<ApiMetadata>;
  return {
    status_code: typeof metadata.status_code === 'number' ? metadata.status_code : fallbackStatus,
    timestamp: typeof metadata.timestamp === 'string' ? metadata.timestamp : new Date().toISOString(),
    error: typeof metadata.error === 'string' ? metadata.error : undefined,
    message: typeof metadata.message === 'string' ? metadata.message : undefined,
  };
}

async function request<TData>(path: string, options: RequestOptions = {}): Promise<ApiResponse<TData>> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
    signal: options.signal,
    cache: options.cache,
    credentials: options.credentials,
    integrity: options.integrity,
    keepalive: options.keepalive,
    mode: options.mode,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
  });

  const parsed = await parseJsonSafe(response);
  const responseObject = (parsed && typeof parsed === 'object') ? (parsed as Record<string, unknown>) : null;
  const metadata = normalizeMetadata(responseObject?.metadata, response.status);
  const data = (responseObject?.data as TData) ?? (undefined as TData);

  if (!response.ok) {
    throw new ApiError({
      message: `Request failed with status ${response.status}`,
      statusCode: response.status,
      backendError: metadata.error,
      backendMessage: metadata.message,
      response: parsed,
    });
  }

  return { data, metadata };
}

export const httpClient = {
  get<TData>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return request<TData>(path, { ...options, method: 'GET' });
  },
  post<TData>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    const payload =
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer
        ? (body as BodyInit)
        : body !== undefined
          ? JSON.stringify(body)
          : undefined;

    return request<TData>(path, { ...options, method: 'POST', body: payload });
  },
  patch<TData>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    return request<TData>(path, { ...options, method: 'PATCH', body: payload });
  },
};

