import type { ReactElement } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';
import { PUBLIC_NAV_ITEMS } from '../constants/navigation.ts';

export function PublicLayout(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-dim-grey-50 text-dim-grey-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dim-grey-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Brand Logo / Name */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-peach-fuzz-500 uppercase">
              EventSphere
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden items-center gap-6 md:flex">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium text-dim-grey-600 transition-colors hover:text-peach-fuzz-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Links */}
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.LOGIN}
              className="rounded-lg px-4 py-2 text-sm font-medium text-dim-grey-700 transition-colors hover:text-peach-fuzz-500"
            >
              Log in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="rounded-lg bg-peach-fuzz-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-peach-fuzz-600"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex items-center justify-center gap-6 border-t border-dim-grey-100 py-2.5 md:hidden">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-xs font-medium text-dim-grey-600 transition-colors hover:text-peach-fuzz-500"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dim-grey-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <span className="text-lg font-bold tracking-tight text-peach-fuzz-500 uppercase">
                EventSphere
              </span>
              <p className="mt-1 max-w-sm text-sm text-dim-grey-600">
                A modern event and workshop management platform to discover,
                host, and celebrate experiences.
              </p>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex items-center gap-6 text-sm text-dim-grey-600">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="transition-colors hover:text-peach-fuzz-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-dim-grey-100 pt-6 text-center text-xs text-dim-grey-500">
            &copy; {new Date().getFullYear()} EventSphere. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
