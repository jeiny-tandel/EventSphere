import * as Yup from 'yup';

export interface RoleFormValues {
  name: string;
  description?: string;
}

export type CreateRoleFormValues = RoleFormValues;
export type EditRoleFormValues = RoleFormValues;

export const roleValidationSchema: Yup.ObjectSchema<RoleFormValues> = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name cannot exceed 50 characters')
    .required('Role name is required'),
  description: Yup.string()
    .max(250, 'Description cannot exceed 250 characters')
    .optional(),
});

export const createRoleValidationSchema = roleValidationSchema;
export const editRoleValidationSchema = roleValidationSchema;
