import type { UserProfile } from './auth.types.ts';

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface AssignUserRolePayload {
  roleId: string;
}

export interface UpdateUserStatusPayload {
  isActive: boolean;
}

export type User = UserProfile;
export type UserResponse = UserProfile;
