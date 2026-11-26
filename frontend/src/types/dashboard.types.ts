import type { RegistrationStatus } from './registration.types.ts';

export type DashboardScope = 'global' | 'organizer' | 'restricted';

export interface DashboardPermissions {
  canViewUsers: boolean;
  canViewEvents: boolean;
}

export interface DashboardMetrics {
  totalUsers: number | null;
  totalEvents: number;
  publishedEvents: number;
  totalTicketsBooked: number;
  totalActiveRegistrations: number;
}

export interface DashboardRegistrationTrendItem {
  date: string;
  tickets: number;
  registrations: number;
}

export interface DashboardCategoryCountItem {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface DashboardRegistrationStatusItem {
  status: RegistrationStatus;
  count: number;
  tickets: number;
}

export interface DashboardPopularEvent {
  id: string;
  title: string;
  categoryName: string;
  startDate: string;
  capacity: number | null;
  price: number;
  ticketsBooked: number;
  registrationsCount: number;
  remainingSeats: number | null;
  estimatedBookingValue: number;
}

export interface DashboardRecentRegistrationAttendee {
  id: string;
  name: string;
  email: string;
}

export interface DashboardRecentRegistrationEvent {
  id: string;
  title: string;
  price: number;
  startDate: string | null;
}

export interface DashboardRecentRegistration {
  id: string;
  quantity: number;
  status: RegistrationStatus;
  createdAt: string;
  totalPrice: number;
  attendee: DashboardRecentRegistrationAttendee;
  event: DashboardRecentRegistrationEvent;
}

export interface DashboardUpcomingEvent {
  id: string;
  title: string;
  categoryName: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number | null;
  price: number;
  ticketsBooked: number;
  remainingSeats: number | null;
}

export interface DashboardCharts {
  registrationTrends: DashboardRegistrationTrendItem[];
  eventsByCategory: DashboardCategoryCountItem[];
  registrationsByStatus: DashboardRegistrationStatusItem[];
  popularEvents: DashboardPopularEvent[];
}

export interface DashboardTables {
  recentRegistrations: DashboardRecentRegistration[];
  upcomingEvents: DashboardUpcomingEvent[];
  popularEvents: DashboardPopularEvent[];
}

export interface DashboardOverview {
  scope: DashboardScope;
  permissions: DashboardPermissions;
  metrics: DashboardMetrics;
  charts: DashboardCharts;
  tables: DashboardTables;
}
