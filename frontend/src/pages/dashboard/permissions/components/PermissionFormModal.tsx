import type { ReactElement } from 'react';
import { Modal } from 'antd';
import { useFormik } from 'formik';
import { Button, Input, TextArea } from '../../../../components/common';
import {
  permissionValidationSchema,
  type PermissionFormValues,
} from '../../../../schemas/permissions.schema.ts';

export type PermissionFormMode = 'create' | 'edit';

export interface PermissionFormModalProps {
  open: boolean;
  mode: PermissionFormMode;
  initialValues?: {
    name: string;
    description?: string | null;
  };
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function PermissionFormModal({
  open,
  mode,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting = false,
}: PermissionFormModalProps): ReactElement {
  const isEdit = mode === 'edit';

  const formik = useFormik<PermissionFormValues>({
    initialValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
    },
    enableReinitialize: true,
    validationSchema: permissionValidationSchema,
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

  const titleText = isEdit ? 'Edit Permission' : 'Create Permission';
  const submitText = isEdit ? 'Save Changes' : 'Create Permission';

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
        <Input
          id={isEdit ? 'edit-permission-name' : 'permission-name'}
          name="name"
          label="Permission Name"
          placeholder="e.g. events.create"
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

        <TextArea
          id={isEdit ? 'edit-permission-description' : 'permission-description'}
          name="description"
          label="Description"
          placeholder="Enter permission description (optional)"
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

export default PermissionFormModal;
