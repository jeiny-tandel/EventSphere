import { api } from './axios.ts';
import type {
  AssignPermissionsPayload,
  CreateRolePayload,
  RemovePermissionsPayload,
  Role,
  RoleResponse,
  UpdateRolePayload,
} from '../types/rbac.types.ts';

export async function getRoles(): Promise<Role[]> {
  const response = await api.get<Role[]>('/roles');
  return response.data;
}

export async function getRoleById(id: string): Promise<Role> {
  const response = await api.get<Role>(`/roles/${id}`);
  return response.data;
}

export async function createRole(
  data: CreateRolePayload,
): Promise<RoleResponse> {
  const response = await api.post<RoleResponse>('/roles', data);
  return response.data;
}

export async function updateRole(
  id: string,
  data: UpdateRolePayload,
): Promise<RoleResponse> {
  const response = await api.patch<RoleResponse>(`/roles/${id}`, data);
  return response.data;
}

export async function deleteRole(id: string): Promise<RoleResponse> {
  const response = await api.delete<RoleResponse>(`/roles/${id}`);
  return response.data;
}

export async function assignRolePermissions(
  id: string,
  payload: AssignPermissionsPayload,
): Promise<Role> {
  const response = await api.post<Role>(`/roles/${id}/permissions`, payload);
  return response.data;
}

export async function removeRolePermissions(
  id: string,
  payload: RemovePermissionsPayload,
): Promise<Role> {
  const response = await api.delete<Role>(`/roles/${id}/permissions`, {
    data: payload,
  });
  return response.data;
}
