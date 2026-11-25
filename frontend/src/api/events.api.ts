import { api } from './axios.ts';
import type {
  CreateEventCategoryPayload,
  CreateEventPayload,
  Event,
  EventCategory,
  UpdateEventCategoryPayload,
  UpdateEventPayload,
} from '../types/event.types.ts';

// Event APIs
export async function getEvents(): Promise<Event[]> {
  const response = await api.get<Event[]>('/events');
  return response.data;
}

export async function getManagementEvents(): Promise<Event[]> {
  const response = await api.get<Event[]>('/events/manage');
  return response.data;
}

export async function getEventById(id: string): Promise<Event> {
  const response = await api.get<Event>(`/events/${id}`);
  return response.data;
}

export async function createEvent(
  payload: CreateEventPayload,
): Promise<Event> {
  const response = await api.post<Event>('/events', payload);
  return response.data;
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<Event> {
  const response = await api.patch<Event>(`/events/${id}`, payload);
  return response.data;
}

export async function deleteEvent(id: string): Promise<Event> {
  const response = await api.delete<Event>(`/events/${id}`);
  return response.data;
}

// Event Category APIs
export async function getEventCategories(): Promise<EventCategory[]> {
  const response = await api.get<EventCategory[]>('/event-categories');
  return response.data;
}

export async function createEventCategory(
  payload: CreateEventCategoryPayload,
): Promise<EventCategory> {
  const response = await api.post<EventCategory>('/event-categories', payload);
  return response.data;
}

export async function updateEventCategory(
  id: string,
  payload: UpdateEventCategoryPayload,
): Promise<EventCategory> {
  const response = await api.patch<EventCategory>(
    `/event-categories/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteEventCategory(
  id: string,
): Promise<EventCategory> {
  const response = await api.delete<EventCategory>(`/event-categories/${id}`);
  return response.data;
}
