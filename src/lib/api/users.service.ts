import { apiClient } from './client';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';
import {
  CreateUserPayload,
  GlobalRole,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
  User,
  UserQueryFilters,
} from '@/types/user';

export const usersService = {
  /**
   * List users with pagination, search, and role/status filtering
   * GET /api/v1/users
   */
  async listUsers(filters: UserQueryFilters = {}): Promise<PaginatedApiResponse<User>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }
    if (filters.role) {
      params.role = filters.role;
    }
    if (filters.isActive !== undefined && filters.isActive !== '') {
      params.isActive = filters.isActive;
    }

    return await apiClient<PaginatedApiResponse<User>>('/users', {
      method: 'GET',
      params,
    });
  },

  /**
   * Admin account provisioning (CA-04: no self-registration)
   * Primary: POST /api/v1/users
   * Fallback: POST /api/v1/auth/register (per OpenAPI)
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    try {
      const res = await apiClient<ApiResponse<User>>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    } catch (err: unknown) {
      // If /users returned 404, fallback to /auth/register
      const errorObj = err as { status?: number };
      if (errorObj?.status === 404) {
        const res = await apiClient<ApiResponse<User>>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return res.data;
      }
      throw err;
    }
  },

  /**
   * Get user details by ID
   * GET /api/v1/users/{userId}
   */
  async getUserById(userId: string): Promise<User> {
    const res = await apiClient<ApiResponse<User>>(`/users/${userId}`);
    return res.data;
  },

  /**
   * Change user global role (Admin only, FR-AUTH-09)
   * PATCH /api/v1/users/{userId}/role
   */
  async updateUserRole(userId: string, globalRole: GlobalRole): Promise<User> {
    const payload: UpdateUserRolePayload = { globalRole };
    const res = await apiClient<ApiResponse<User>>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Activate or deactivate user (Admin only, FR-AUTH-07)
   * PATCH /api/v1/users/{userId}/status
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const payload: UpdateUserStatusPayload = { isActive };
    const res = await apiClient<ApiResponse<User>>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};
