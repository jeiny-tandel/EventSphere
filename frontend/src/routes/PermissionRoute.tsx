import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '../components/common';
import { ROUTES } from '../constants/routes.ts';
import { useAppSelector } from '../hooks/redux.ts';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '../utils/permission.utils.ts';

export interface PermissionRouteProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
}

/**
 * Route guard that validates user authentication and permissions before
 * rendering protected nested routes via React Router's Outlet.
 */
export function PermissionRoute({
  permission,
  permissions,
  requireAll = false,
  fallbackPath = ROUTES.EVENTS,
}: PermissionRouteProps): ReactElement {
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

  let hasAccess = true;

  if (permission !== undefined) {
    hasAccess = hasPermission(user, permission);
  } else if (permissions !== undefined) {
    hasAccess = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
  }

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

export default PermissionRoute;
