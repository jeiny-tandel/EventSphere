import type { Event } from './event.types.ts';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
  event: Event;
}

export interface RegisterForEventPayload {
  quantity?: number;
}

export interface RegistrationAttendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ManagementEventRegistration extends EventRegistration {
  user: RegistrationAttendee;
}

export interface UpdateRegistrationStatusPayload {
  status: RegistrationStatus;
}
