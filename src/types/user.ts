/**
 * User and Role types conforming to SRS v3.0 §4.2, §6.2 and Prisma schema
 */

export type GlobalRole = 'Administrator' | 'Project Manager' | 'Team Member' | 'Viewer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  globalRole: GlobalRole;
  configuredCapacityHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  globalRole: GlobalRole;
  configuredCapacityHours?: number;
}

export interface UpdateProfilePayload {
  fullName?: string;
  configuredCapacityHours?: number;
}

export interface UpdateUserRolePayload {
  globalRole: GlobalRole;
}

export interface UpdateUserStatusPayload {
  isActive: boolean;
}

export interface UserQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: GlobalRole | '';
  isActive?: boolean | '';
}
