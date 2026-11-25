import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { LoginPage } from '../pages/auth/LoginPage.tsx';
import { RegisterPage } from '../pages/auth/RegisterPage.tsx';
import { DashboardOverviewPage } from '../pages/dashboard/DashboardOverviewPage.tsx';
import { EventsManagementPage } from '../pages/dashboard/events/EventsManagementPage.tsx';
import { MyRegistrationsPage } from '../pages/dashboard/registrations/MyRegistrationsPage.tsx';
import { UsersPage } from '../pages/dashboard/users/UsersPage.tsx';
import { RolesPage } from '../pages/dashboard/roles/RolesPage.tsx';
import { PermissionsPage } from '../pages/dashboard/permissions/PermissionsPage.tsx';
import { NotFoundPage } from '../pages/NotFoundPage.tsx';
import { AboutPage } from '../pages/public/AboutPage.tsx';
import { EventsPage } from '../pages/public/EventsPage.tsx';
import { HomePage } from '../pages/public/HomePage.tsx';
import { ProfilePage } from '../pages/public/ProfilePage.tsx';
import { PermissionRoute } from './PermissionRoute.tsx';
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

          {/* Authenticated Attendee Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path={ROUTES.MY_REGISTRATIONS}
              element={<MyRegistrationsPage />}
            />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Management Dashboard Routes */}
        <Route
          element={
            <PermissionRoute
              permission="dashboard.access"
              fallbackPath={ROUTES.EVENTS}
            />
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardLayout />}>
            <Route index element={<DashboardOverviewPage />} />
            <Route
              element={
                <PermissionRoute
                  permission="events.view"
                  fallbackPath={ROUTES.EVENTS}
                />
              }
            >
              <Route
                path={ROUTES.EVENTS_MANAGEMENT}
                element={<EventsManagementPage />}
              />
            </Route>

            {/* Granular Permission-Protected Management Routes */}
            <Route
              element={
                <PermissionRoute
                  permission="users.view"
                  fallbackPath={ROUTES.DASHBOARD}
                />
              }
            >
              <Route path={ROUTES.USERS} element={<UsersPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission="roles.view"
                  fallbackPath={ROUTES.DASHBOARD}
                />
              }
            >
              <Route path={ROUTES.ROLES} element={<RolesPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission="permissions.view"
                  fallbackPath={ROUTES.DASHBOARD}
                />
              }
            >
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
