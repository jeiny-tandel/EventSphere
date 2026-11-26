import { api } from './axios.ts';
import type { DashboardOverview } from '../types/dashboard.types.ts';

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverview>('/dashboard/overview');
  return response.data;
}
