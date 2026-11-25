import { api } from './axios.ts';
import type { EventRegistration } from '../types/registration.types.ts';

export async function registerForEvent(
  eventId: string,
): Promise<EventRegistration> {
  const response = await api.post<EventRegistration>(
    `/events/${eventId}/registrations`,
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
