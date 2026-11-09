import { apiClient, saveStoredTokens, getStoredTokens } from './client';
import { ApiResponse } from '@/types/api';
import {
  ChangePasswordPayload,
  LoginPayload,
  LogoutPayload,
  TokenPair,
} from '@/types/auth';
import { UpdateProfilePayload, User } from '@/types/user';

export const authService = {
  /**
   * Authenticate user with email and password
   * POST /api/v1/auth/login
   */
  async login(payload: LoginPayload): Promise<TokenPair> {
    const res = await apiClient<ApiResponse<TokenPair>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    saveStoredTokens(res.data);
    return res.data;
  },

  /**
   * Exchange refresh token for a new token pair
   * POST /api/v1/auth/refresh
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const res = await apiClient<ApiResponse<TokenPair>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
    saveStoredTokens(res.data);
    return res.data;
  },

  /**
   * Invalidate access token JTI and revoke refresh session
   * POST /api/v1/auth/logout
   * Sends refreshToken in body per Errata E-007
   */
  async logout(payload?: LogoutPayload): Promise<void> {
    const currentTokens = getStoredTokens();
    const tokenToRevoke = payload?.refreshToken || currentTokens?.refreshToken;

    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokenToRevoke || '' }),
      });
    } catch {
      // Even if network fails, ensure client session is purged
    } finally {
      saveStoredTokens(null);
    }
  },

  /**
   * Get current authenticated user details
   * GET /api/v1/auth/me
   */
  async getMe(): Promise<User> {
    const res = await apiClient<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  /**
   * Update own profile (name, configuredCapacityHours)
   * PATCH /api/v1/auth/me
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await apiClient<ApiResponse<User>>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Change own password. Revokes all active refresh sessions.
   * PATCH /api/v1/auth/password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
