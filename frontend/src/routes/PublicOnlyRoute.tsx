import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../components/common';
import { ROUTES } from '../constants/routes.ts';
import { useAppSelector } from '../hooks/redux.ts';
import { hasPermission } from '../utils/permission.utils.ts';

export function PublicOnlyRoute(): ReactElement {
  const { isAuthenticated, isInitialized, user } = useAppSelector(
    (state) => state.auth,
  );

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    const destination = hasPermission(user, 'dashboard.access')
      ? ROUTES.DASHBOARD
      : ROUTES.EVENTS;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
