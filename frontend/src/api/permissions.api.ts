import { api } from './axios.ts';
import type {
  CreatePermissionCategoryPayload,
  CreatePermissionPayload,
  Permission,
  PermissionCategory,
  UpdatePermissionCategoryPayload,
  UpdatePermissionPayload,
} from '../types/rbac.types.ts';

export async function getPermissions(): Promise<Permission[]> {
  const response = await api.get<Permission[]>('/permissions');
  return response.data;
}

export async function getPermissionCategories(): Promise<PermissionCategory[]> {
  const response = await api.get<PermissionCategory[]>('/permission-categories');
  return response.data;
}

export async function createPermissionCategory(
  data: CreatePermissionCategoryPayload,
): Promise<PermissionCategory> {
  const response = await api.post<PermissionCategory>(
    '/permission-categories',
    data,
  );
  return response.data;
}

export async function updatePermissionCategory(
  id: string,
  data: UpdatePermissionCategoryPayload,
): Promise<PermissionCategory> {
  const response = await api.patch<PermissionCategory>(
    `/permission-categories/${id}`,
    data,
  );
  return response.data;
}

export async function deletePermissionCategory(
  id: string,
): Promise<PermissionCategory> {
  const response = await api.delete<PermissionCategory>(
    `/permission-categories/${id}`,
  );
  return response.data;
}

export async function getPermissionById(id: string): Promise<Permission> {
  const response = await api.get<Permission>(`/permissions/${id}`);
  return response.data;
}

export async function createPermission(
  data: CreatePermissionPayload,
): Promise<Permission> {
  const response = await api.post<Permission>('/permissions', data);
  return response.data;
}

export async function updatePermission(
  id: string,
  data: UpdatePermissionPayload,
): Promise<Permission> {
  const response = await api.patch<Permission>(`/permissions/${id}`, data);
  return response.data;
}

export async function deletePermission(id: string): Promise<Permission> {
  const response = await api.delete<Permission>(`/permissions/${id}`);
  return response.data;
}
