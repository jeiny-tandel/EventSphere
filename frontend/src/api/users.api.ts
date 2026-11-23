import { api } from './axios.ts';
import type { UserProfile } from '../types/auth.types.ts';
import type {
  AssignUserRolePayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
} from '../types/user.types.ts';

export async function getUsers(): Promise<UserProfile[]> {
  const response = await api.get<UserProfile[]>('/users');
  return response.data;
}

export async function getUserById(id: string): Promise<UserProfile> {
  const response = await api.get<UserProfile>(`/users/${id}`);
  return response.data;
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload,
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>(`/users/${id}`, data);
  return response.data;
}

export async function deactivateUser(id: string): Promise<UserProfile> {
  const response = await api.delete<UserProfile>(`/users/${id}`);
  return response.data;
}

export async function assignUserRole(
  id: string,
  data: AssignUserRolePayload,
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>(`/users/${id}/role`, data);
  return response.data;
}

export async function updateUserStatus(
  id: string,
  data: UpdateUserStatusPayload,
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>(`/users/${id}/status`, data);
  return response.data;
}
