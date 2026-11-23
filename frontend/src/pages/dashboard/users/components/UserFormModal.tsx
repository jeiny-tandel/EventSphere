import type { ReactElement } from 'react';
import { Modal } from 'antd';
import { useFormik } from 'formik';
import { Button, Input } from '../../../../components/common';
import {
  userValidationSchema,
  type UserFormValues,
} from '../../../../schemas/user.schema.ts';
import type { UpdateUserPayload, User } from '../../../../types/user.types.ts';

export interface UserFormModalProps {
  open: boolean;
  user: User | null;
  onCancel: () => void;
  onSubmit: (id: string, values: UpdateUserPayload) => void | Promise<void>;
  isSubmitting: boolean;
}

export function UserFormModal({
  open,
  user,
  onCancel,
  onSubmit,
  isSubmitting,
}: UserFormModalProps): ReactElement {
  const formik = useFormik<UserFormValues>({
    initialValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
    enableReinitialize: true,
    validationSchema: userValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!user) return;
      try {
        const trimmedPhone = values.phoneNumber?.trim();
        const payload: UpdateUserPayload = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phoneNumber: trimmedPhone || undefined,
        };

        await onSubmit(user.id, payload);
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
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="text-lg font-bold text-dim-grey-900">Edit User</div>
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
          Save Changes
        </Button>,
      ]}
    >
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-4 py-2"
        noValidate
      >
        <Input
          id="edit-user-first-name"
          name="firstName"
          label="First Name"
          placeholder="Enter first name"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={submitting}
          error={
            formik.touched.firstName && formik.errors.firstName
              ? formik.errors.firstName
              : undefined
          }
          required
        />

        <Input
          id="edit-user-last-name"
          name="lastName"
          label="Last Name"
          placeholder="Enter last name"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={submitting}
          error={
            formik.touched.lastName && formik.errors.lastName
              ? formik.errors.lastName
              : undefined
          }
          required
        />

        <Input
          id="edit-user-email"
          name="email"
          label="Email"
          type="email"
          placeholder="Enter email address"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={submitting}
          error={
            formik.touched.email && formik.errors.email
              ? formik.errors.email
              : undefined
          }
          required
        />

        <Input
          id="edit-user-phone-number"
          name="phoneNumber"
          label="Phone Number"
          type="tel"
          placeholder="Enter phone number (optional)"
          value={formik.values.phoneNumber}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={submitting}
          error={
            formik.touched.phoneNumber && formik.errors.phoneNumber
              ? formik.errors.phoneNumber
              : undefined
          }
        />
      </form>
    </Modal>
  );
}

export default UserFormModal;
