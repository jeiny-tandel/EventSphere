import type { UserProfile } from '../types';

export const USER_ROLES = {
  ADMIN: 'admin',
} as const;

export function isAdminUser(user: UserProfile | null | undefined): boolean {
  return user?.role?.name?.trim().toLowerCase() === USER_ROLES.ADMIN;
}
