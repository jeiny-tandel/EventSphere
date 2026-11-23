import { api } from './axios.ts';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  RegisterResponse,
  UserProfile,
} from '../types';

export async function loginUser(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

export async function registerUser(
  data: RegisterPayload,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/auth/profile');
  return response.data;
}
