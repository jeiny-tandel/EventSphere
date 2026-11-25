import type { UserProfile } from '../types';

export const USER_ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
} as const;

export function isAdminUser(user: UserProfile | null | undefined): boolean {
  return user?.role?.name?.trim().toLowerCase() === USER_ROLES.ADMIN;
}

export function isManagementUser(
  user: UserProfile | null | undefined,
): boolean {
  const roleName = user?.role?.name?.trim().toLowerCase();
  return roleName === USER_ROLES.ADMIN || roleName === USER_ROLES.ORGANIZER;
}
