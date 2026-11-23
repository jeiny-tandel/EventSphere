import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../components/common';
import { ROUTES } from '../constants/routes.ts';
import { isAdminUser } from '../constants/roles.ts';
import { useAppSelector } from '../hooks/redux.ts';

export function AdminRoute(): ReactElement {
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  const isAdmin = isAdminUser(user);

  if (!isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
