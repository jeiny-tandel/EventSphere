import { api } from './axios.ts';
import type {
  EventRegistration,
  ManagementEventRegistration,
  RegistrationStatus,
} from '../types/registration.types.ts';

export async function registerForEvent(
  eventId: string,
  quantity = 1,
): Promise<EventRegistration> {
  const response = await api.post<EventRegistration>(
    `/events/${eventId}/registrations`,
    { quantity },
  );
  return response.data;
}

export async function getMyRegistrations(): Promise<EventRegistration[]> {
  const response = await api.get<EventRegistration[]>('/registrations/my');
  return response.data;
}

export async function getRegistrationById(
  id: string,
): Promise<EventRegistration> {
  const response = await api.get<EventRegistration>(`/registrations/${id}`);
  return response.data;
}

export async function cancelRegistration(
  id: string,
): Promise<EventRegistration> {
  const response = await api.patch<EventRegistration>(
    `/registrations/${id}/cancel`,
  );
  return response.data;
}

export async function getManagementRegistrations(): Promise<
  ManagementEventRegistration[]
> {
  const response = await api.get<ManagementEventRegistration[]>(
    '/registrations/manage',
  );
  return response.data;
}

export async function updateRegistrationStatus(
  id: string,
  status: RegistrationStatus,
): Promise<ManagementEventRegistration> {
  const response = await api.patch<ManagementEventRegistration>(
    `/registrations/${id}/status`,
    { status },
  );
  return response.data;
}
