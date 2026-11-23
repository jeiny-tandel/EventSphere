import { createElement, type ReactNode } from 'react';
import {
  AppstoreOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
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
  adminOnly?: boolean;
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
  },
  {
    key: 'roles',
    label: 'Roles',
    path: ROUTES.ROLES,
    icon: createElement(SafetyCertificateOutlined, { className: 'text-base' }),
    adminOnly: true,
  },
  {
    key: 'permissions',
    label: 'Permissions',
    path: ROUTES.PERMISSIONS,
    icon: createElement(KeyOutlined, { className: 'text-base' }),
    adminOnly: true,
  },
];
