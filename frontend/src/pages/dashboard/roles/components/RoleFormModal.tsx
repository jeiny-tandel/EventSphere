import type { ReactElement } from 'react';
import { Modal } from 'antd';
import { useFormik } from 'formik';
import { Button, Input, TextArea } from '../../../../components/common';
import {
  createRoleValidationSchema,
  editRoleValidationSchema,
  type CreateRoleFormValues,
} from '../../../../schemas/roles.schema.ts';

export type RoleFormMode = 'create' | 'edit';

export interface RoleFormModalProps {
  open: boolean;
  mode: RoleFormMode;
  initialValues?: {
    name: string;
    description?: string | null;
  };
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
  onClose: () => void;
}

export function RoleFormModal({
  open,
  mode,
  initialValues,
  onSubmit,
  onClose,
}: RoleFormModalProps): ReactElement {
  const isEdit = mode === 'edit';
  const validationSchema = isEdit
    ? editRoleValidationSchema
    : createRoleValidationSchema;

  const formik = useFormik<CreateRoleFormValues>({
    initialValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
    },
    enableReinitialize: true,
    validationSchema,
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

  const handleCancel = () => {
    if (formik.isSubmitting) return;
    formik.resetForm();
    onClose();
  };

  const titleText = isEdit ? 'Edit Role' : 'Create Role';
  const submitText = isEdit ? 'Save Changes' : 'Create Role';

  return (
    <Modal
      title={
        <div className="text-lg font-bold text-dim-grey-900">{titleText}</div>
      }
      open={open}
      onCancel={formik.isSubmitting ? undefined : handleCancel}
      closable={!formik.isSubmitting}
      maskClosable={!formik.isSubmitting}
      destroyOnClose
      centered
      footer={[
        <Button
          key="cancel"
          onClick={handleCancel}
          disabled={formik.isSubmitting}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={formik.isSubmitting}
          disabled={!formik.dirty || !formik.isValid || formik.isSubmitting}
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
          id={isEdit ? 'edit-name' : 'name'}
          name="name"
          label="Role Name"
          placeholder="Enter role name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.name && formik.errors.name
              ? formik.errors.name
              : undefined
          }
          required
        />

        <TextArea
          id={isEdit ? 'edit-description' : 'description'}
          name="description"
          label="Description"
          placeholder="Enter role description (optional)"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
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

export default RoleFormModal;
