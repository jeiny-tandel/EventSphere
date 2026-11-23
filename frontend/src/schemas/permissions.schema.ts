import * as Yup from 'yup';

export interface PermissionFormValues {
  name: string;
  description?: string;
}

export type CreatePermissionFormValues = PermissionFormValues;
export type EditPermissionFormValues = PermissionFormValues;

export const permissionValidationSchema: Yup.ObjectSchema<PermissionFormValues> = Yup.object({
  name: Yup.string()
    .trim()
    .required('Permission name is required'),
  description: Yup.string()
    .optional(),
});

export const createPermissionValidationSchema = permissionValidationSchema;
export const editPermissionValidationSchema = permissionValidationSchema;
