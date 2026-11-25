import * as Yup from 'yup';

export interface CategoryFormValues {
  name: string;
  description?: string;
}

export type CreateCategoryFormValues = CategoryFormValues;
export type EditCategoryFormValues = CategoryFormValues;

export const categoryValidationSchema: Yup.ObjectSchema<CategoryFormValues> = Yup.object({
  name: Yup.string()
    .trim()
    .required('Category name is required'),
  description: Yup.string()
    .trim()
    .optional(),
});

export const createCategoryValidationSchema = categoryValidationSchema;
export const editCategoryValidationSchema = categoryValidationSchema;
