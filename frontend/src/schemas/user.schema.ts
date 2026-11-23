import * as Yup from 'yup';

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export type CreateUserFormValues = UserFormValues;
export type EditUserFormValues = UserFormValues;

export const userValidationSchema: Yup.ObjectSchema<UserFormValues> = Yup.object({
  firstName: Yup.string()
    .trim()
    .required('First name is required'),
  lastName: Yup.string()
    .trim()
    .required('Last name is required'),
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phoneNumber: Yup.string()
    .trim()
    .optional(),
});

export const createUserValidationSchema = userValidationSchema;
export const editUserValidationSchema = userValidationSchema;
