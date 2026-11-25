import type { RoleResponse } from './rbac.types.ts';

export interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = RoleResponse;

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roleId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: UserRole | null;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
}

export type RegisterResponse = UserProfile;
