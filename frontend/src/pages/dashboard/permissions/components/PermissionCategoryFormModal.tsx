import type { ReactElement } from 'react';
import { Modal } from 'antd';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Input, TextArea } from '../../../../components/common';
import type {
  CreatePermissionCategoryPayload,
  PermissionCategory,
  UpdatePermissionCategoryPayload,
} from '../../../../types/rbac.types.ts';

export type PermissionCategoryFormMode = 'create' | 'edit';

export interface PermissionCategoryFormValues {
  name: string;
  description?: string;
}

export const permissionCategoryValidationSchema: Yup.ObjectSchema<PermissionCategoryFormValues> =
  Yup.object({
    name: Yup.string().trim().required('Category name is required'),
    description: Yup.string().trim().optional(),
  });

export interface PermissionCategoryFormModalProps {
  open: boolean;
  mode?: PermissionCategoryFormMode;
  category?: PermissionCategory | null;
  initialValues?: {
    name: string;
    description?: string | null;
  } | null;
  onSubmit: (
    values: CreatePermissionCategoryPayload | UpdatePermissionCategoryPayload,
  ) => Promise<void> | void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function PermissionCategoryFormModal({
  open,
  mode,
  category,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting = false,
}: PermissionCategoryFormModalProps): ReactElement {
  const initialData = category || initialValues;
  const isEdit = mode ? mode === 'edit' : Boolean(initialData);

  const formik = useFormik<PermissionCategoryFormValues>({
    initialValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
    },
    enableReinitialize: true,
    validationSchema: permissionCategoryValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const trimmedName = values.name.trim();
        const trimmedDescription = values.description?.trim();

        await onSubmit({
          name: trimmedName,
          description: trimmedDescription || undefined,
        });
        formik.resetForm();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const submitting = isSubmitting || formik.isSubmitting;

  const handleCancel = () => {
    if (submitting) return;
    formik.resetForm();
    onClose();
  };

  const titleText = isEdit
    ? 'Edit Permission Category'
    : 'Create Permission Category';
  const submitText = isEdit ? 'Save Changes' : 'Create Category';

  return (
    <Modal
      title={
        <div className="text-lg font-bold text-dim-grey-900">{titleText}</div>
      }
      open={open}
      onCancel={submitting ? undefined : handleCancel}
      closable={!submitting}
      maskClosable={!submitting}
      destroyOnClose
      centered
      footer={[
        <Button
          key="cancel"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          disabled={!formik.dirty || !formik.isValid || submitting}
          onClick={() => formik.handleSubmit()}
        >
          {submitText}
        </Button>,
      ]}
    >
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-4 py-2"
        noValidate
      >
        <div>
          <Input
            id={isEdit ? 'edit-category-name' : 'category-name'}
            name="name"
            label="Category Name"
            placeholder="e.g. EVENTS or AUDIT_LOGS"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={submitting}
            error={
              formik.touched.name && formik.errors.name
                ? formik.errors.name
                : undefined
            }
            required
          />
        </div>

        <TextArea
          id={isEdit ? 'edit-category-description' : 'category-description'}
          name="description"
          label="Description"
          placeholder="Enter category description (optional)"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={submitting}
          error={
            formik.touched.description && formik.errors.description
              ? formik.errors.description
              : undefined
          }
          rows={3}
        />
      </form>
    </Modal>
  );
}

export default PermissionCategoryFormModal;
