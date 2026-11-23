import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';
import { useAppSelector } from '../hooks/redux.ts';

export function ProtectedRoute(): ReactElement {
  const location = useLocation();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
