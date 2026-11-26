import type { ReactElement } from 'react';
import { Modal, message } from 'antd';
import { useFormik } from 'formik';
import { Button, Input, TextArea } from '../../../../components/common';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux.ts';
import {
  categoryValidationSchema,
  type CategoryFormValues,
} from '../../../../schemas/category.schema.ts';
import {
  createEventCategory,
  updateEventCategory,
} from '../../../../store/slices/eventSlice.ts';
import type {
  CreateEventCategoryPayload,
  EventCategory,
  UpdateEventCategoryPayload,
} from '../../../../types/event.types.ts';
import { extractErrorMessage } from '../../../../utils';

export interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  category?: EventCategory | null;
}

const defaultInitialValues: CategoryFormValues = {
  name: '',
  description: '',
};

export function CategoryFormModal({
  open,
  onClose,
  category,
}: CategoryFormModalProps): ReactElement {
  const dispatch = useAppDispatch();
  const { isSubmitting } = useAppSelector((state) => state.events);

  const isEdit = Boolean(category);

  const initialValues: CategoryFormValues = {
    name: category?.name ?? defaultInitialValues.name,
    description: category?.description ?? defaultInitialValues.description,
  };

  const formik = useFormik<CategoryFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema: categoryValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const trimmedName = values.name.trim();
        const trimmedDescription = values.description?.trim();

        if (isEdit && category) {
          const payload: UpdateEventCategoryPayload = {
            name: trimmedName,
            description: trimmedDescription || undefined,
          };
          await dispatch(
            updateEventCategory({ id: category.id, data: payload }),
          ).unwrap();
          message.success('Event category updated successfully.');
        } else {
          const payload: CreateEventCategoryPayload = {
            name: trimmedName,
            description: trimmedDescription || undefined,
          };
          await dispatch(createEventCategory(payload)).unwrap();
          message.success('Event category created successfully.');
        }

        formik.resetForm();
        onClose();
      } catch (err) {
        const fallbackMessage = isEdit
          ? 'Failed to update event category. Please try again.'
          : 'Failed to create event category. Please try again.';
        const errorMessage = extractErrorMessage(err, fallbackMessage);
        message.error(errorMessage);
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

  const titleText = isEdit ? 'Edit Event Category' : 'Create Event Category';
  const subtitleText = isEdit
    ? 'Update category name and description.'
    : 'Add a new category for organizing events.';
  const submitText = isEdit ? 'Save Changes' : 'Create Category';

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold text-dim-grey-900">
            {titleText}
          </div>
          <div className="mt-0.5 text-xs font-normal text-dim-grey-500">
            {subtitleText}
          </div>
        </div>
      }
      open={open}
      onCancel={submitting ? undefined : handleCancel}
      closable={!submitting}
      maskClosable={!submitting}
      destroyOnClose
      centered
      width={520}
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
          id="category-name"
          name="name"
          label="Category Name"
          placeholder="e.g. Technology, Workshop, Conference"
          required
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.name ? formik.errors.name : undefined}
          disabled={submitting}
        />

        <TextArea
          id="category-description"
          name="description"
          label="Description"
          placeholder="Brief description of the event category (optional)..."
          rows={3}
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.description ? formik.errors.description : undefined
          }
          disabled={submitting}
        />
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
