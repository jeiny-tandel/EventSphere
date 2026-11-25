import type { UserProfile } from '../types/auth.types.ts';

/**
 * Checks whether a user has one specific permission.
 *
 * @param user - The user profile object, or null/undefined if unauthenticated.
 * @param permission - The exact permission name to check.
 * @returns True if the user possesses the permission, false otherwise.
 */
export function hasPermission(
  user: UserProfile | null | undefined,
  permission: string,
): boolean {
  if (!user || !Array.isArray(user.permissions)) {
    return false;
  }

  if (typeof permission !== 'string' || permission.length === 0) {
    return false;
  }

  return user.permissions.includes(permission);
}

/**
 * Checks whether a user has at least one permission from a supplied list.
 *
 * @param user - The user profile object, or null/undefined if unauthenticated.
 * @param permissions - The list of permission names to check against.
 * @returns True if the user has at least one of the requested permissions, false otherwise.
 */
export function hasAnyPermission(
  user: UserProfile | null | undefined,
  permissions: string[],
): boolean {
  if (!user || !Array.isArray(user.permissions)) {
    return false;
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  const userPermissionsSet = new Set(user.permissions);
  return permissions.some((permission) => userPermissionsSet.has(permission));
}

/**
 * Checks whether a user has every permission from a supplied list.
 *
 * @param user - The user profile object, or null/undefined if unauthenticated.
 * @param permissions - The list of required permission names.
 * @returns True if the user possesses all requested permissions, or if the list is empty for a valid user.
 */
export function hasAllPermissions(
  user: UserProfile | null | undefined,
  permissions: string[],
): boolean {
  if (!user || !Array.isArray(user.permissions)) {
    return false;
  }

  if (!Array.isArray(permissions)) {
    return false;
  }

  if (permissions.length === 0) {
    return true;
  }

  const userPermissionsSet = new Set(user.permissions);
  return permissions.every((permission) => userPermissionsSet.has(permission));
}
