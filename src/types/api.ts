/**
 * Standard API response interfaces conforming to SRS v3.0 §4.14
 */

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface SystemHealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime?: number;
  services?: {
    database?: { status: 'healthy' | 'unhealthy'; latencyMs?: number };
    redis?: { status: 'healthy' | 'unhealthy'; latencyMs?: number };
  };
}
