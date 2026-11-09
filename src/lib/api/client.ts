/**
 * Centralized API Client with standard error handling, correlation ID,
 * and single-flight token refresh mutex.
 */

import { buildApiUrl } from './config';
import { ApiErrorResponse, ApiResponse, PaginatedApiResponse } from '@/types/api';
import { TokenPair } from '@/types/auth';

const STORAGE_KEY_AUTH = 'fyp_pm_tokens';

export class ApiClientError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public correlationId?: string | null;

  constructor(status: number, code: string, message: string, details?: unknown, correlationId?: string | null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
  }
}

// Token storage helpers
export function getStoredTokens(): TokenPair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export function saveStoredTokens(tokens: TokenPair | null): void {
  try {
    if (!tokens) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(tokens));
    }
  } catch {
    // ignore
  }
}

// Refresh token mutex to prevent concurrent refresh storms
let refreshPromise: Promise<TokenPair | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedCallback(cb: () => void): () => void {
  onUnauthorizedCallback = cb;
  return () => {
    onUnauthorizedCallback = null;
  };
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, params, ...fetchInit } = options;

  let url = buildApiUrl(endpoint);
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = new Headers(fetchInit.headers || {});
  if (!headers.has('Content-Type') && !(fetchInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  // Inject correlation ID if not present
  if (!headers.has('x-correlation-id')) {
    headers.set('x-correlation-id', crypto.randomUUID ? crypto.randomUUID() : `cid-${Date.now()}`);
  }

  // Inject Bearer token
  if (!skipAuth) {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { ...fetchInit, headers });
  } catch (networkError: unknown) {
    const message = networkError instanceof Error ? networkError.message : 'Network error';
    throw new ApiClientError(0, 'NETWORK_ERROR', `Unable to connect to backend: ${message}`);
  }

  // Handle 401 Unauthorized with token refresh mutex
  if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshedTokens = await handleTokenRefresh();
    if (refreshedTokens) {
      // Retry original request with newly obtained token
      headers.set('Authorization', `Bearer ${refreshedTokens.accessToken}`);
      response = await fetch(url, { ...fetchInit, headers });
    } else {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      throw new ApiClientError(401, 'UNAUTHORIZED', 'Session expired. Please log in again.');
    }
  }

  // Parse response
  let json: unknown = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  const correlationId = response.headers.get('x-correlation-id') || headers.get('x-correlation-id');

  if (!response.ok) {
    let errorCode = 'REQUEST_FAILED';
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetails: unknown = undefined;

    if (json && typeof json === 'object') {
      const errorEnvelope = json as ApiErrorResponse;
      if (errorEnvelope.error) {
        errorCode = errorEnvelope.error.code || errorCode;
        errorMessage = errorEnvelope.error.message || errorMessage;
        errorDetails = errorEnvelope.error.details;
      }
    }

    if (response.status === 423) {
      errorCode = 'ACCOUNT_LOCKED';
      errorMessage = errorMessage || 'Account locked due to consecutive failed login attempts. Please wait 15 minutes.';
    }

    throw new ApiClientError(response.status, errorCode, errorMessage, errorDetails, correlationId);
  }

  // If status is 204 or no content
  if (response.status === 204 || !json) {
    return {} as T;
  }

  return json as T;
}

/**
 * Mutex token refresh logic. Guarantees only one in-flight POST /auth/refresh call.
 */
async function handleTokenRefresh(): Promise<TokenPair | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentTokens = getStoredTokens();
    if (!currentTokens?.refreshToken) {
      saveStoredTokens(null);
      return null;
    }

    try {
      const refreshUrl = buildApiUrl('/auth/refresh');
      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });

      if (!res.ok) {
        saveStoredTokens(null);
        return null;
      }

      const body = (await res.json()) as ApiResponse<TokenPair>;
      const newTokens = body.data;
      if (newTokens?.accessToken) {
        saveStoredTokens(newTokens);
        return newTokens;
      }

      saveStoredTokens(null);
      return null;
    } catch {
      saveStoredTokens(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
