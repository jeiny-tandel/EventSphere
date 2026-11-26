import { useCallback, useMemo, useState } from 'react';
import type { Event } from '../types/event.types.ts';
import {
  DEFAULT_EVENT_FILTERS,
  filterAndSortEvents,
  hasActiveEventFilters,
  type EventFilterState,
} from '../utils';

export function useEventFilters(
  events: Event[],
  initialOverrides?: Partial<EventFilterState>,
) {
  const initialState: EventFilterState = useMemo(
    () => ({
      ...DEFAULT_EVENT_FILTERS,
      ...initialOverrides,
    }),
    [initialOverrides],
  );

  const [filters, setFilters] = useState<EventFilterState>(initialState);

  const updateFilter = useCallback(
    <K extends keyof EventFilterState>(key: K, value: EventFilterState[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(initialState);
  }, [initialState]);

  const filteredEvents = useMemo(
    () => filterAndSortEvents(events, filters),
    [events, filters],
  );

  const hasActiveFilters = useMemo(
    () => hasActiveEventFilters(filters),
    [filters],
  );

  return {
    filters,
    filteredEvents,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  };
}
