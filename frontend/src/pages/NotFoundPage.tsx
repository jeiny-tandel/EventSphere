import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';

export function NotFoundPage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dim-grey-50 px-4 text-center">
      <span className="text-7xl font-extrabold text-peach-fuzz-500">404</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-dim-grey-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-base text-dim-grey-600">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          to={ROUTES.HOME}
          className="rounded-lg bg-peach-fuzz-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-peach-fuzz-600"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
