import { buildApiUrl, getApiBaseUrl } from './config';
import { SystemHealthResponse } from '@/types/api';

export const healthService = {
  /**
   * Probes backend health endpoint
   * Tries /api/v1/health or /health
   */
  async checkHealth(): Promise<{ isHealthy: boolean; latencyMs: number; data?: SystemHealthResponse; error?: string }> {
    const start = performance.now();
    const primaryUrl = buildApiUrl('/health');

    try {
      const res = await fetch(primaryUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        let data: SystemHealthResponse | undefined;
        try {
          data = (await res.json()) as SystemHealthResponse;
        } catch {
          // ignore parsing error if pure text
        }
        return { isHealthy: true, latencyMs, data };
      }

      // If /api/v1/health failed, try /health at the origin
      const baseUrl = getApiBaseUrl();
      const origin = new URL(baseUrl).origin;
      const rootHealthUrl = `${origin}/health`;

      const fallbackRes = await fetch(rootHealthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (fallbackRes.ok) {
        const fallbackLatency = Math.round(performance.now() - start);
        return { isHealthy: true, latencyMs: fallbackLatency };
      }

      return {
        isHealthy: false,
        latencyMs,
        error: `Server responded with status ${res.status}`,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const message = err instanceof Error ? err.message : 'Connection failed';
      return { isHealthy: false, latencyMs, error: message };
    }
  },
};
