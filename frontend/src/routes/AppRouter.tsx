import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { LoginPage } from '../pages/auth/LoginPage.tsx';
import { RegisterPage } from '../pages/auth/RegisterPage.tsx';
import { DashboardOverviewPage } from '../pages/dashboard/DashboardOverviewPage.tsx';
import { RolesPage } from '../pages/dashboard/roles/RolesPage.tsx';
import { PermissionsPage } from '../pages/dashboard/permissions/PermissionsPage.tsx';
import { NotFoundPage } from '../pages/NotFoundPage.tsx';
import { AboutPage } from '../pages/public/AboutPage.tsx';
import { EventsPage } from '../pages/public/EventsPage.tsx';
import { HomePage } from '../pages/public/HomePage.tsx';
import { AdminRoute } from './AdminRoute.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { PublicOnlyRoute } from './PublicOnlyRoute.tsx';

export function AppRouter(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.EVENTS} element={<EventsPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardLayout />}>
            <Route index element={<DashboardOverviewPage />} />

            {/* Admin-Only Management Routes */}
            <Route element={<AdminRoute />}>
              <Route path={ROUTES.ROLES} element={<RolesPage />} />
              <Route path={ROUTES.PERMISSIONS} element={<PermissionsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Public-Only Authentication Routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
