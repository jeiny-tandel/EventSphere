import type { ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { isAxiosError } from "axios";
import { useFormik } from "formik";
import { registerUser } from "../../api";
import { Button, Card, Input } from "../../components/common";
import { ROUTES } from "../../constants/routes.ts";
import { registerValidationSchema } from "../../schemas/auth.schema.ts";
import type { RegisterFormData, RegisterPayload } from "../../types";

export function RegisterPage(): ReactElement {
  const navigate = useNavigate();

  const formik = useFormik<RegisterFormData>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const trimmedPhone = values.phoneNumber?.trim();

        const sanitizedPayload: RegisterPayload = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          ...(trimmedPhone ? { phoneNumber: trimmedPhone } : {}),
        };

        await registerUser(sanitizedPayload);
        message.success(
          "Registration successful! Please log in with your credentials.",
        );
        navigate(ROUTES.LOGIN);
      } catch (error) {
        let errorMessage = "Registration failed. Please try again.";

        if (isAxiosError(error) && error.response?.data) {
          const responseData = error.response.data as {
            message?: string | string[];
          };
          if (typeof responseData.message === "string") {
            errorMessage = responseData.message;
          } else if (
            Array.isArray(responseData.message) &&
            responseData.message.length > 0
          ) {
            errorMessage = responseData.message.join(", ");
          }
        }

        message.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-dim-grey-50 px-4 py-12">
      <Card
        className="w-full max-w-md rounded-2xl border border-dim-grey-200 bg-white shadow-sm"
        bodyClassName="!p-8"
      >
        {/* EventSphere Branding */}
        <div className="mb-8 text-center">
          <span className="text-base font-bold tracking-wider text-peach-fuzz-500 uppercase">
            EventSphere
          </span>
          <h1 className="mt-2 text-2xl font-bold text-dim-grey-900">
            Create an account
          </h1>
          <p className="mt-1 text-sm text-dim-grey-600">
            Join EventSphere to discover and manage events
          </p>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              label="First Name"
              placeholder="John"
              required
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.firstName && formik.errors.firstName
                  ? formik.errors.firstName
                  : undefined
              }
            />

            <Input
              id="lastName"
              name="lastName"
              type="text"
              label="Last Name"
              placeholder="Doe"
              required
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.lastName && formik.errors.lastName
                  ? formik.errors.lastName
                  : undefined
              }
            />
          </div>

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
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            label="Phone Number"
            placeholder="Enter 10-digit phone number"
            value={formik.values.phoneNumber}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 10);
              formik.setFieldValue("phoneNumber", value);
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.phoneNumber && formik.errors.phoneNumber
                ? formik.errors.phoneNumber
                : undefined
            }
          />

          <Input
            id="password"
            name="password"
            isPassword
            label="Password"
            placeholder="At least 8 characters"
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

          <Input
            id="confirmPassword"
            name="confirmPassword"
            isPassword
            label="Confirm Password"
            placeholder="Re-enter your password"
            required
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.confirmPassword && formik.errors.confirmPassword
                ? formik.errors.confirmPassword
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
              Create account
            </Button>
          </div>
        </form>

        {/* Link to Login */}
        <div className="mt-6 text-center text-sm text-dim-grey-600">
          Already have an account?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-peach-fuzz-500 hover:text-peach-fuzz-400 hover:underline"
          >
            Log in
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default RegisterPage;
