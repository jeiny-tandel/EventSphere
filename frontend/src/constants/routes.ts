export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  EVENTS: '/events',
  ABOUT: '/about',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
