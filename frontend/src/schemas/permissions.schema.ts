import * as Yup from 'yup';

export interface PermissionFormValues {
  name: string;
  description?: string;
  categoryId: string;
}

export type CreatePermissionFormValues = PermissionFormValues;
export type EditPermissionFormValues = PermissionFormValues;

export const permissionValidationSchema: Yup.ObjectSchema<PermissionFormValues> = Yup.object({
  name: Yup.string()
    .trim()
    .required('Permission name is required'),
  description: Yup.string()
    .optional(),
  categoryId: Yup.string()
    .trim()
    .required('Category is required'),
});

export const createPermissionValidationSchema = permissionValidationSchema;
export const editPermissionValidationSchema = permissionValidationSchema;
