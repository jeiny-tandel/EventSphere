import * as Yup from "yup";
import type { LoginCredentials, RegisterFormData } from "../types";

export const loginValidationSchema: Yup.ObjectSchema<LoginCredentials> =
  Yup.object({
    email: Yup.string()
      .trim()
      .email("Please enter a valid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters long")
      .required("Password is required"),
  });

export const registerValidationSchema: Yup.ObjectSchema<RegisterFormData> =
  Yup.object({
    firstName: Yup.string().trim().required("First name is required"),
    lastName: Yup.string().trim().required("Last name is required"),
    email: Yup.string()
      .trim()
      .lowercase()
      .email("Please enter a valid email address")
      .required("Email is required"),
    phoneNumber: Yup.string()
      .trim()
      .matches(/^[0-9]{10}$/, {
        message: "Phone number must contain exactly 10 digits",
        excludeEmptyString: true,
      })
      .optional(),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters long")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
  });
