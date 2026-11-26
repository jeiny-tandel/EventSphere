import type { ReactElement } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  type Location,
} from 'react-router-dom';
import { message } from 'antd';
import { useFormik } from 'formik';
import { Button, Card, Input } from '../../components/common';
import { ROUTES } from '../../constants/routes.ts';
import { useAppDispatch } from '../../hooks/redux.ts';
import { loginValidationSchema } from '../../schemas/auth.schema.ts';
import { login } from '../../store/slices/authSlice.ts';
import type { LoginCredentials, UserProfile } from '../../types';
import { extractErrorMessage, hasPermission } from '../../utils';

interface LocationState {
  from?: Location;
}

function getRedirectDestination(
  user: UserProfile | null | undefined,
  fromLocation?: Location,
): string {
  const hasDashboardAccess = hasPermission(user, 'dashboard.access');
  const defaultDestination = hasDashboardAccess ? ROUTES.DASHBOARD : ROUTES.EVENTS;

  if (
    fromLocation?.pathname &&
    fromLocation.pathname.startsWith('/') &&
    !fromLocation.pathname.startsWith('//') &&
    fromLocation.pathname !== ROUTES.LOGIN &&
    fromLocation.pathname !== ROUTES.REGISTER
  ) {
    const isManagementRoute =
      fromLocation.pathname === ROUTES.DASHBOARD ||
      fromLocation.pathname.startsWith(`${ROUTES.DASHBOARD}/`);

    if (hasDashboardAccess || !isManagementRoute) {
      return `${fromLocation.pathname}${fromLocation.search || ''}${fromLocation.hash || ''}`;
    }
  }

  return defaultDestination;
}

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const state = location.state as LocationState | null;
  const fromLocation = state?.from;

  const formik = useFormik<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const authResponse = await dispatch(login(values)).unwrap();
        const destination = getRedirectDestination(
          authResponse.user,
          fromLocation,
        );
        navigate(destination, { replace: true });
      } catch (error) {
        message.error(
          extractErrorMessage(
            error,
            'Login failed. Please check your credentials and try again.',
          ),
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-dim-grey-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-dim-grey-600 transition-colors hover:text-peach-fuzz-500"
          >
            &larr; Back to Home
          </Link>
        </div>
        <Card
          className="w-full rounded-2xl border border-dim-grey-200 bg-white shadow-sm"
          bodyClassName="!p-8"
        >
        {/* EventSphere Branding */}
        <div className="mb-8 text-center">
          <span className="text-base font-bold tracking-wider text-peach-fuzz-500 uppercase">
            EventSphere
          </span>
          <h1 className="mt-2 text-2xl font-bold text-dim-grey-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-dim-grey-600">
            Sign in to access your EventSphere account
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            required
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.email && formik.errors.email
                ? formik.errors.email
                : undefined
            }
          />

          <Input
            id="password"
            name="password"
            isPassword
            label="Password"
            placeholder="Enter your password"
            required
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.password && formik.errors.password
                ? formik.errors.password
                : undefined
            }
          />

          <div className="mt-2">
            <Button
              type="primary"
              htmlType="submit"
              fullWidth
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting}
            >
              Log in
            </Button>
          </div>
        </form>

        {/* Link to Register */}
        <div className="mt-6 text-center text-sm text-dim-grey-600">
          Don't have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-peach-fuzz-500 hover:text-peach-fuzz-400 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </Card>
      </div>
    </div>
  );
}

export default LoginPage;
