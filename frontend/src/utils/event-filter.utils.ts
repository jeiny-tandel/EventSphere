import dayjs from 'dayjs';
import type { Event, EventStatus } from '../types/event.types.ts';

export type EventSortField = 'title' | 'startDate' | 'createdAt' | 'price';
export type SortOrder = 'asc' | 'desc';

export interface EventFilterState {
  search: string;
  categoryId?: string;
  status?: EventStatus;
  dateRange: [string | null, string | null];
  sortBy: EventSortField;
  sortOrder: SortOrder;
}

export const DEFAULT_EVENT_FILTERS: EventFilterState = {
  search: '',
  categoryId: undefined,
  status: undefined,
  dateRange: [null, null],
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function hasActiveEventFilters(filters: EventFilterState): boolean {
  return (
    filters.search.trim().length > 0 ||
    Boolean(filters.categoryId) ||
    Boolean(filters.status) ||
    Boolean(filters.dateRange[0] || filters.dateRange[1]) ||
    filters.sortBy !== DEFAULT_EVENT_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_EVENT_FILTERS.sortOrder
  );
}

export function filterAndSortEvents(
  events: readonly Event[],
  filters: EventFilterState,
): Event[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const rangeStart = filters.dateRange[0]
    ? dayjs(filters.dateRange[0]).startOf('day')
    : null;
  const rangeEnd = filters.dateRange[1]
    ? dayjs(filters.dateRange[1]).endOf('day')
    : null;

  const filtered = events.filter((event) => {
    if (
      normalizedSearch &&
      !event.title.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }

    if (filters.categoryId && event.categoryId !== filters.categoryId) {
      return false;
    }

    if (filters.status && event.status !== filters.status) {
      return false;
    }

    if (rangeStart || rangeEnd) {
      const eventStart = dayjs(event.startDate);
      if (!eventStart.isValid()) {
        return false;
      }
      if (rangeStart && eventStart.isBefore(rangeStart)) {
        return false;
      }
      if (rangeEnd && eventStart.isAfter(rangeEnd)) {
        return false;
      }
    }

    return true;
  });

  const direction = filters.sortOrder === 'asc' ? 1 : -1;

  return filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'startDate': {
        const timeA = Date.parse(a.startDate) || 0;
        const timeB = Date.parse(b.startDate) || 0;
        comparison = timeA - timeB;
        break;
      }
      case 'price':
        comparison = Number(a.price ?? 0) - Number(b.price ?? 0);
        break;
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
