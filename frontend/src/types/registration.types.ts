import type { Event } from './event.types.ts';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
  event: Event;
}
