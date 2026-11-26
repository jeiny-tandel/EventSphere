import { useCallback, useMemo, useState } from 'react';
import type { EventRegistration } from '../types/registration.types.ts';
import {
  DEFAULT_REGISTRATION_FILTERS,
  filterAndSortRegistrations,
  hasActiveRegistrationFilters,
  type RegistrationFilterState,
} from '../utils';

export function useRegistrationFilters<T extends EventRegistration>(
  registrations: T[],
  initialOverrides?: Partial<RegistrationFilterState>,
) {
  const initialState: RegistrationFilterState = useMemo(
    () => ({
      ...DEFAULT_REGISTRATION_FILTERS,
      ...initialOverrides,
    }),
    [initialOverrides],
  );

  const [filters, setFilters] = useState<RegistrationFilterState>(initialState);

  const updateFilter = useCallback(
    <K extends keyof RegistrationFilterState>(
      key: K,
      value: RegistrationFilterState[K],
    ) => {
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

  const filteredRegistrations = useMemo(
    () => filterAndSortRegistrations(registrations, filters),
    [registrations, filters],
  );

  const hasActiveFilters = useMemo(
    () => hasActiveRegistrationFilters(filters),
    [filters],
  );

  return {
    filters,
    filteredRegistrations,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  };
}
