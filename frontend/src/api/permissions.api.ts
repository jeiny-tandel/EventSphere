import { api } from './axios.ts';
import type {
  CreatePermissionPayload,
  Permission,
  UpdatePermissionPayload,
} from '../types/rbac.types.ts';

export async function getPermissions(): Promise<Permission[]> {
  const response = await api.get<Permission[]>('/permissions');
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
