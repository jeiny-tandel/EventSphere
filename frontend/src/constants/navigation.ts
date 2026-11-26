import { createElement, type ReactNode } from 'react';
import {
  AppstoreOutlined,
  CalendarOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ROUTES } from './routes.ts';

export interface PublicNavItem {
  label: string;
  path: string;
}

export interface DashboardNavItem {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
  requiredPermission?: string;
}

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'Events', path: ROUTES.EVENTS },
  { label: 'About', path: ROUTES.ABOUT },
];

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    path: ROUTES.DASHBOARD,
    icon: createElement(AppstoreOutlined, { className: 'text-base' }),
    requiredPermission: 'dashboard.access',
  },
  {
    key: 'events',
    label: 'Events',
    path: ROUTES.EVENTS_MANAGEMENT,
    icon: createElement(CalendarOutlined, { className: 'text-base' }),
    requiredPermission: 'events.view',
  },
  {
    key: 'registrations',
    label: 'Registrations',
    path: ROUTES.REGISTRATIONS_MANAGEMENT,
    icon: createElement(SolutionOutlined, { className: 'text-base' }),
    requiredPermission: 'registrations.view',
  },
  {
    key: 'users',
    label: 'Users',
    path: ROUTES.USERS,
    icon: createElement(TeamOutlined, { className: 'text-base' }),
    requiredPermission: 'users.view',
  },
  {
    key: 'roles',
    label: 'Roles',
    path: ROUTES.ROLES,
    icon: createElement(SafetyCertificateOutlined, { className: 'text-base' }),
    requiredPermission: 'roles.view',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    path: ROUTES.PERMISSIONS,
    icon: createElement(KeyOutlined, { className: 'text-base' }),
    requiredPermission: 'permissions.view',
  },
];
