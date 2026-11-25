import { useEffect, type ReactElement } from 'react';
import { DatePicker, InputNumber, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Button, Input, TextArea } from '../../../../components/common';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux.ts';
import {
  createEventValidationSchema,
  type CreateEventFormValues,
} from '../../../../schemas/event.schema.ts';
import {
  createEvent,
  fetchEventCategories,
  updateEvent,
} from '../../../../store/slices/eventSlice.ts';
import type { CreateEventPayload, Event } from '../../../../types/event.types.ts';
import { extractErrorMessage } from '../../../../utils/error.utils.ts';

export interface EventFormModalProps {
  open: boolean;
  event?: Event | null;
  onClose: () => void;
}

const defaultInitialValues: CreateEventFormValues = {
  title: '',
  description: '',
  categoryId: '',
  location: '',
  startDate: '',
  endDate: '',
  capacity: undefined,
  status: 'DRAFT',
};

export function EventFormModal({
  open,
  event,
  onClose,
}: EventFormModalProps): ReactElement {
  const dispatch = useAppDispatch();
  const { categories, isLoading, isSubmitting } = useAppSelector(
    (state) => state.events,
  );

  const isEdit = Boolean(event);

  useEffect(() => {
    if (open && categories.length === 0) {
      dispatch(fetchEventCategories());
    }
  }, [dispatch, open, categories.length]);

  const initialValues: CreateEventFormValues = {
    title: event?.title ?? defaultInitialValues.title,
    description: event?.description ?? defaultInitialValues.description,
    categoryId: event?.categoryId ?? defaultInitialValues.categoryId,
    location: event?.location ?? defaultInitialValues.location,
    startDate: event?.startDate ?? defaultInitialValues.startDate,
    endDate: event?.endDate ?? defaultInitialValues.endDate,
    capacity: event?.capacity ?? defaultInitialValues.capacity,
    status: event?.status ?? defaultInitialValues.status,
  };

  const formik = useFormik<CreateEventFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema: createEventValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload: CreateEventPayload = {
          title: values.title.trim(),
          description: values.description.trim(),
          categoryId: values.categoryId,
          location: values.location.trim(),
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          capacity: values.capacity ? Number(values.capacity) : undefined,
          status: values.status,
        };

        if (isEdit && event) {
          await dispatch(
            updateEvent({ id: event.id, data: payload }),
          ).unwrap();
          message.success('Event updated successfully.');
        } else {
          await dispatch(createEvent(payload)).unwrap();
          message.success('Event created successfully.');
        }

        formik.resetForm();
        onClose();
      } catch (err) {
        const fallbackMessage = isEdit
          ? 'Failed to update event. Please try again.'
          : 'Failed to create event. Please try again.';
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

  const titleText = isEdit ? 'Edit Event' : 'Create Event';
  const subtitleText = isEdit
    ? 'Update event details, schedule, or status.'
    : 'Enter details to schedule and publish a new event.';
  const submitText = isEdit ? 'Save Changes' : 'Create Event';

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
      width={640}
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
        {/* Title */}
        <Input
          id="event-title"
          name="title"
          label="Event Title"
          placeholder="e.g. Annual Tech Symposium 2027"
          required
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.title ? formik.errors.title : undefined}
          disabled={submitting}
        />

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="event-category"
            className="text-sm font-medium text-dim-grey-800"
          >
            Category
            <span className="ml-1 text-powder-blush-500">*</span>
          </label>
          <Select
            id="event-category"
            placeholder={
              isLoading && categories.length === 0
                ? 'Loading categories...'
                : 'Select category'
            }
            value={formik.values.categoryId || undefined}
            onChange={(val) => formik.setFieldValue('categoryId', val)}
            onBlur={() => formik.setFieldTouched('categoryId', true)}
            status={
              formik.touched.categoryId && formik.errors.categoryId
                ? 'error'
                : undefined
            }
            disabled={submitting}
            loading={isLoading && categories.length === 0}
            options={categories.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            className="w-full"
          />
          {formik.touched.categoryId && formik.errors.categoryId && (
            <span className="text-xs text-powder-blush-500">
              {formik.errors.categoryId}
            </span>
          )}
        </div>

        {/* Description */}
        <TextArea
          id="event-description"
          name="description"
          label="Description"
          placeholder="Provide event overview, agenda, or highlights..."
          rows={3}
          required
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.description ? formik.errors.description : undefined
          }
          disabled={submitting}
        />

        {/* Location */}
        <Input
          id="event-location"
          name="location"
          label="Location"
          placeholder="e.g. Convention Hall A, San Francisco or Online"
          required
          value={formik.values.location}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.location ? formik.errors.location : undefined}
          disabled={submitting}
        />

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="event-start-date"
              className="text-sm font-medium text-dim-grey-800"
            >
              Start Date & Time
              <span className="ml-1 text-powder-blush-500">*</span>
            </label>
            <DatePicker
              id="event-start-date"
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              placeholder="Select start date"
              value={
                formik.values.startDate
                  ? dayjs(formik.values.startDate)
                  : null
              }
              onChange={(date) => {
                formik.setFieldValue(
                  'startDate',
                  date ? date.toISOString() : '',
                );
              }}
              onBlur={() => formik.setFieldTouched('startDate', true)}
              status={
                formik.touched.startDate && formik.errors.startDate
                  ? 'error'
                  : undefined
              }
              disabled={submitting}
              className="w-full"
            />
            {formik.touched.startDate && formik.errors.startDate && (
              <span className="text-xs text-powder-blush-500">
                {formik.errors.startDate}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="event-end-date"
              className="text-sm font-medium text-dim-grey-800"
            >
              End Date & Time
              <span className="ml-1 text-powder-blush-500">*</span>
            </label>
            <DatePicker
              id="event-end-date"
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              placeholder="Select end date"
              value={
                formik.values.endDate ? dayjs(formik.values.endDate) : null
              }
              onChange={(date) => {
                formik.setFieldValue(
                  'endDate',
                  date ? date.toISOString() : '',
                );
              }}
              onBlur={() => formik.setFieldTouched('endDate', true)}
              status={
                formik.touched.endDate && formik.errors.endDate
                  ? 'error'
                  : undefined
              }
              disabled={submitting}
              className="w-full"
            />
            {formik.touched.endDate && formik.errors.endDate && (
              <span className="text-xs text-powder-blush-500">
                {formik.errors.endDate}
              </span>
            )}
          </div>
        </div>

        {/* Capacity & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="event-capacity"
              className="text-sm font-medium text-dim-grey-800"
            >
              Capacity
            </label>
            <InputNumber
              id="event-capacity"
              min={1}
              placeholder="e.g. 100 (optional)"
              value={formik.values.capacity ?? null}
              onChange={(val) =>
                formik.setFieldValue('capacity', val ?? undefined)
              }
              onBlur={() => formik.setFieldTouched('capacity', true)}
              status={
                formik.touched.capacity && formik.errors.capacity
                  ? 'error'
                  : undefined
              }
              disabled={submitting}
              className="w-full"
            />
            {formik.touched.capacity && formik.errors.capacity && (
              <span className="text-xs text-powder-blush-500">
                {formik.errors.capacity}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="event-status"
              className="text-sm font-medium text-dim-grey-800"
            >
              Status
              <span className="ml-1 text-powder-blush-500">*</span>
            </label>
            <Select
              id="event-status"
              value={formik.values.status}
              onChange={(value) => formik.setFieldValue('status', value)}
              onBlur={() => formik.setFieldTouched('status', true)}
              status={
                formik.touched.status && formik.errors.status
                  ? 'error'
                  : undefined
              }
              disabled={submitting}
              options={[
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Published', value: 'PUBLISHED' },
                { label: 'Cancelled', value: 'CANCELLED' },
                { label: 'Completed', value: 'COMPLETED' },
              ]}
              className="w-full"
            />
            {formik.touched.status && formik.errors.status && (
              <span className="text-xs text-powder-blush-500">
                {formik.errors.status}
              </span>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default EventFormModal;
