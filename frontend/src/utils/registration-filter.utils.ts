import dayjs from 'dayjs';
import type {
  EventRegistration,
  RegistrationStatus,
} from '../types/registration.types.ts';
import type { SortOrder } from './event-filter.utils.ts';

export type RegistrationSortField =
  | 'createdAt'
  | 'eventTitle'
  | 'quantity'
  | 'totalPrice'
  | 'eventStartDate';

export interface RegistrationFilterState {
  search: string;
  status?: RegistrationStatus;
  dateRange: [string | null, string | null];
  sortBy: RegistrationSortField;
  sortOrder: SortOrder;
}

export const DEFAULT_REGISTRATION_FILTERS: RegistrationFilterState = {
  search: '',
  status: undefined,
  dateRange: [null, null],
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function hasActiveRegistrationFilters(
  filters: RegistrationFilterState,
): boolean {
  return (
    filters.search.trim().length > 0 ||
    Boolean(filters.status) ||
    Boolean(filters.dateRange[0] || filters.dateRange[1]) ||
    filters.sortBy !== DEFAULT_REGISTRATION_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_REGISTRATION_FILTERS.sortOrder
  );
}

function getRegistrationTotalPrice(registration: EventRegistration): number {
  const unitPrice = Number(registration.event?.price ?? 0);
  const quantity = registration.quantity ?? 1;
  return unitPrice * quantity;
}

export function filterAndSortRegistrations<T extends EventRegistration>(
  registrations: readonly T[],
  filters: RegistrationFilterState,
): T[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const rangeStart = filters.dateRange[0]
    ? dayjs(filters.dateRange[0]).startOf('day')
    : null;
  const rangeEnd = filters.dateRange[1]
    ? dayjs(filters.dateRange[1]).endOf('day')
    : null;

  const filtered = registrations.filter((registration) => {
    if (normalizedSearch) {
      const eventTitle = registration.event?.title?.toLowerCase() ?? '';
      const attendee = (
        registration as {
          user?: { firstName?: string; lastName?: string; email?: string };
        }
      ).user;
      const firstName = attendee?.firstName?.toLowerCase() ?? '';
      const lastName = attendee?.lastName?.toLowerCase() ?? '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = attendee?.email?.toLowerCase() ?? '';

      if (
        !eventTitle.includes(normalizedSearch) &&
        !firstName.includes(normalizedSearch) &&
        !lastName.includes(normalizedSearch) &&
        !fullName.includes(normalizedSearch) &&
        !email.includes(normalizedSearch)
      ) {
        return false;
      }
    }

    if (filters.status && registration.status !== filters.status) {
      return false;
    }

    if (rangeStart || rangeEnd) {
      const bookedAt = dayjs(registration.createdAt);
      if (!bookedAt.isValid()) {
        return false;
      }
      if (rangeStart && bookedAt.isBefore(rangeStart)) {
        return false;
      }
      if (rangeEnd && bookedAt.isAfter(rangeEnd)) {
        return false;
      }
    }

    return true;
  });

  const direction = filters.sortOrder === 'asc' ? 1 : -1;

  return filtered.sort((a, b) => {
    let comparison: number;

    switch (filters.sortBy) {
      case 'eventTitle':
        comparison = (a.event?.title ?? '').localeCompare(
          b.event?.title ?? '',
        );
        break;
      case 'quantity':
        comparison = (a.quantity ?? 1) - (b.quantity ?? 1);
        break;
      case 'totalPrice':
        comparison =
          getRegistrationTotalPrice(a) - getRegistrationTotalPrice(b);
        break;
      case 'eventStartDate': {
        const startA = Date.parse(a.event?.startDate ?? '') || 0;
        const startB = Date.parse(b.event?.startDate ?? '') || 0;
        comparison = startA - startB;
        break;
      }
      case 'createdAt':
      default: {
        const createdA = Date.parse(a.createdAt) || 0;
        const createdB = Date.parse(b.createdAt) || 0;
        comparison = createdA - createdB;
        break;
      }
    }

    return comparison * direction;
  });
}
