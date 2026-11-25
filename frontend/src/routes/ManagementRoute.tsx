import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '../components/common';
import { ROUTES } from '../constants/routes.ts';
import { isManagementUser } from '../constants/roles.ts';
import { useAppSelector } from '../hooks/redux.ts';

export function ManagementRoute(): ReactElement {
  const location = useLocation();
  const { isAuthenticated, isInitialized, user } = useAppSelector(
    (state) => state.auth,
  );

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const isManagement = isManagementUser(user);

  if (!isManagement) {
    return <Navigate to={ROUTES.EVENTS} replace />;
  }

  return <Outlet />;
}

export default ManagementRoute;
