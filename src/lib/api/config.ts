/**
 * API Configuration and URL normalization
 */

const STORAGE_KEY_API_URL = 'fyp_pm_api_base_url';

export const DEFAULT_API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://phase0-fyp-pm-backend-2-production.up.railway.app/api/v1';

export function getFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://ais-dev-ie2ejvajid65m2rpxf2jot-820785736558.asia-southeast1.run.app';
}

export function getApiBaseUrl(): string {
  try {
    const customUrl = localStorage.getItem(STORAGE_KEY_API_URL);
    if (customUrl && customUrl.trim()) {
      return sanitizeApiUrl(customUrl.trim());
    }
  } catch {
    // fallback if localStorage is inaccessible
  }
  return sanitizeApiUrl(DEFAULT_API_BASE_URL);
}

export function setApiBaseUrl(url: string): void {
  try {
    if (!url || !url.trim() || url.trim() === DEFAULT_API_BASE_URL) {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_API_URL, sanitizeApiUrl(url.trim()));
    }
  } catch {
    // ignore storage errors
  }
}

export function resetApiBaseUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  } catch {
    // ignore
  }
}

/**
 * Sanitizes the URL and ensures it ends without a trailing slash
 * and avoids duplicating /api/v1 if included multiple times.
 */
export function sanitizeApiUrl(url: string): string {
  let cleaned = url.replace(/\/+$/, '');
  // If user typed e.g. "http://localhost:3000" without /api/v1, let's keep it or append /api/v1 if not present
  if (!cleaned.includes('/api/v1') && !cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api/v1`;
  }
  return cleaned;
}

/**
 * Constructs an absolute URL ensuring no duplicate /api/v1 prefixes.
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If the path already begins with /api/v1 and the base ends with /api/v1, strip it from path
  if (base.endsWith('/api/v1') && normalizedPath.startsWith('/api/v1')) {
    return `${base}${normalizedPath.substring(7)}`;
  }

  return `${base}${normalizedPath}`;
}
