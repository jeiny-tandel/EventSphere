import type { ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';
import { useAppSelector } from '../hooks/redux.ts';

export function NotFoundPage(): ReactElement {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dim-grey-50 px-4 text-center">
      <span className="text-7xl font-extrabold text-peach-fuzz-500">404</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-dim-grey-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-base text-dim-grey-600">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-lg border border-dim-grey-300 bg-white px-5 py-2.5 text-sm font-medium text-dim-grey-700 shadow-xs transition-colors hover:bg-dim-grey-50 hover:text-dim-grey-900"
        >
          Go Back
        </button>

        {isInitialized ? (
          <Link
            to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME}
            className="rounded-lg bg-peach-fuzz-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-peach-fuzz-600"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          </Link>
        ) : (
          <span className="inline-block h-10 w-36 animate-pulse rounded-lg bg-dim-grey-200" />
        )}
      </div>
    </div>
  );
}

export default NotFoundPage;
