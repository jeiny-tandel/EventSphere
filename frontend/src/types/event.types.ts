export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface EventCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventOrganizer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  categoryId: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number | null;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  category: EventCategory;
  organizer: EventOrganizer;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  status?: EventStatus;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  status?: EventStatus;
}

export interface CreateEventCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateEventCategoryPayload {
  name?: string;
  description?: string;
}
