import { useEffect, useRef, useState, type ReactElement } from "react";
import { DatePicker, InputNumber, Modal, Select, Upload, message } from "antd";
import {
  DeleteOutlined,
  PictureOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { Button, Input, TextArea } from "../../../../components/common";
import { useAppDispatch, useAppSelector } from "../../../../hooks/redux.ts";
import {
  createEventValidationSchema,
  type CreateEventFormValues,
} from "../../../../schemas/event.schema.ts";
import {
  createEvent,
  deleteEventCoverImage,
  fetchEventCategories,
  updateEvent,
  uploadEventCoverImage,
} from "../../../../store/slices/eventSlice.ts";
import type {
  CreateEventPayload,
  Event,
} from "../../../../types/event.types.ts";
import { extractErrorMessage } from "../../../../utils/error.utils.ts";
import { getEventCoverImageUrl } from "../../../../utils/event-image.utils.ts";

export interface EventFormModalProps {
  open: boolean;
  event?: Event | null;
  onClose: () => void;
}

const defaultInitialValues: CreateEventFormValues = {
  title: "",
  description: "",
  categoryId: "",
  location: "",
  startDate: "",
  endDate: "",
  capacity: undefined,
  status: "DRAFT",
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface EventFormModalContentProps {
  event?: Event | null;
  onClose: () => void;
}

function EventFormModalContent({
  event,
  onClose,
}: EventFormModalContentProps): ReactElement {
  const dispatch = useAppDispatch();
  const { categories, isLoading, isSubmitting } = useAppSelector(
    (state) => state.events,
  );

  const isEdit = Boolean(event);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemovalStaged, setIsRemovalStaged] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [hasImageLoadError, setHasImageLoadError] = useState(false);

  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchEventCategories());
    }
  }, [dispatch, categories.length]);

  // Clean up object URL on component unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const activeImageUrl =
    previewUrl ??
    (!isRemovalStaged && event?.coverImage
      ? getEventCoverImageUrl(event.coverImage)
      : null);

  const resetImageState = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsRemovalStaged(false);
    setCreatedEventId(null);
    setHasImageLoadError(false);
  };

  const handleBeforeUpload = (file: File): boolean => {
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isValidType) {
      message.error("Only JPG, PNG, and WebP images are allowed.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error("Cover image size must not exceed 5 MB.");
      return false;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const newUrl = URL.createObjectURL(file);
    previewUrlRef.current = newUrl;
    setPreviewUrl(newUrl);
    setSelectedFile(file);
    setIsRemovalStaged(false);
    setHasImageLoadError(false);
    return false;
  };

  const handleRemoveCover = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setHasImageLoadError(false);
    if (event?.coverImage) {
      setIsRemovalStaged(true);
    }
  };

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
      let targetEventId = event?.id ?? createdEventId;
      let eventUpdatedOrCreated = false;

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
          await dispatch(updateEvent({ id: event.id, data: payload })).unwrap();
          eventUpdatedOrCreated = true;
        } else if (createdEventId) {
          await dispatch(
            updateEvent({ id: createdEventId, data: payload }),
          ).unwrap();
          eventUpdatedOrCreated = true;
        } else {
          const created = await dispatch(createEvent(payload)).unwrap();
          targetEventId = created.id;
          setCreatedEventId(created.id);
          eventUpdatedOrCreated = true;
        }

        // Handle cover image upload or removal
        if (selectedFile && targetEventId) {
          await dispatch(
            uploadEventCoverImage({ id: targetEventId, file: selectedFile }),
          ).unwrap();
        } else if (isEdit && isRemovalStaged && targetEventId) {
          await dispatch(deleteEventCoverImage(targetEventId)).unwrap();
        }

        const successMessage = isEdit
          ? "Event updated successfully."
          : createdEventId
            ? "Event cover image uploaded successfully."
            : "Event created successfully.";
        message.success(successMessage);

        formik.resetForm();
        resetImageState();
        onClose();
      } catch (err) {
        let fallbackMessage = isEdit
          ? "Failed to update event. Please try again."
          : createdEventId
            ? "Failed to update event. Please try again."
            : "Failed to create event. Please try again.";

        if (eventUpdatedOrCreated && targetEventId && selectedFile) {
          fallbackMessage = isEdit
            ? "Event details updated, but failed to upload cover image. Please retry."
            : "Event details saved, but failed to upload cover image. Please retry.";
        } else if (eventUpdatedOrCreated && isEdit && isRemovalStaged && targetEventId) {
          fallbackMessage =
            "Event details updated, but failed to remove cover image. Please retry.";
        }

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
    resetImageState();
    onClose();
  };

  const isFormChanged =
    formik.dirty ||
    Boolean(selectedFile) ||
    isRemovalStaged ||
    Boolean(createdEventId);

  const submitText = createdEventId
    ? "Retry Cover Upload"
    : isEdit
      ? "Save Changes"
      : "Create Event";

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="space-y-4 py-2"
      noValidate
    >
      {/* Retry notification banner if event was created but image upload failed */}
      {createdEventId && (
        <div className="rounded-lg bg-peach-fuzz-50 border border-peach-fuzz-200 p-3 text-xs text-dim-grey-700">
          <div className="font-semibold text-dim-grey-900">Upload Event Cover</div>
          <div className="mt-0.5">
            Event details saved. You can now retry uploading the cover image.
          </div>
        </div>
      )}

      {/* Cover Image Selection & Preview */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-dim-grey-800">
          Cover Image
        </label>
        {activeImageUrl ? (
          <div className="relative overflow-hidden rounded-lg border border-dim-grey-200 bg-dim-grey-50">
            <div className="flex max-h-48 w-full items-center justify-center overflow-hidden bg-dim-grey-100 aspect-video">
              {hasImageLoadError ? (
                <div className="flex flex-col items-center justify-center p-4 text-center text-dim-grey-400">
                  <PictureOutlined className="mb-1 text-2xl text-dim-grey-400" />
                  <span className="text-xs text-dim-grey-500">
                    Failed to load image preview
                  </span>
                </div>
              ) : (
                <img
                  src={activeImageUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onError={() => setHasImageLoadError(true)}
                />
              )}
            </div>
            <div className="flex items-center justify-between border-t border-dim-grey-200 bg-white px-3 py-2">
              <span className="truncate text-xs text-dim-grey-600 max-w-60">
                {selectedFile
                  ? selectedFile.name
                  : hasImageLoadError
                    ? "Image unavailable"
                    : "Current cover image"}
              </span>
              <div className="flex items-center gap-2">
                <Upload
                  beforeUpload={handleBeforeUpload}
                  showUploadList={false}
                  accept="image/jpeg,image/png,image/webp"
                  disabled={submitting}
                  multiple={false}
                >
                  <Button
                    type="default"
                    className="flex! items-center gap-1 text-xs!"
                    disabled={submitting}
                  >
                    <UploadOutlined /> Replace
                  </Button>
                </Upload>
                <Button
                  type="text"
                  className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700!"
                  disabled={submitting}
                  onClick={handleRemoveCover}
                >
                  <DeleteOutlined /> Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Upload
            beforeUpload={handleBeforeUpload}
            showUploadList={false}
            accept="image/jpeg,image/png,image/webp"
            disabled={submitting}
            multiple={false}
            className="w-full block"
          >
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-dim-grey-300 p-6 text-center transition-colors hover:border-peach-fuzz-500 hover:bg-dim-grey-50/50 cursor-pointer">
              <PictureOutlined className="mb-2 text-3xl text-dim-grey-400" />
              <span className="text-sm font-medium text-dim-grey-800">
                Click to select event cover image
              </span>
              <span className="mt-1 text-xs text-dim-grey-500">
                Supports JPG, PNG, and WebP (up to 5 MB)
              </span>
            </div>
          </Upload>
        )}
      </div>

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
              ? "Loading categories..."
              : "Select category"
          }
          value={formik.values.categoryId || undefined}
          onChange={(val) => formik.setFieldValue("categoryId", val)}
          onBlur={() => formik.setFieldTouched("categoryId", true)}
          status={
            formik.touched.categoryId && formik.errors.categoryId
              ? "error"
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
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            placeholder="Select start date"
            value={
              formik.values.startDate ? dayjs(formik.values.startDate) : null
            }
            onChange={(date) => {
              formik.setFieldValue(
                "startDate",
                date ? date.toISOString() : "",
              );
            }}
            onBlur={() => formik.setFieldTouched("startDate", true)}
            status={
              formik.touched.startDate && formik.errors.startDate
                ? "error"
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
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            placeholder="Select end date"
            value={
              formik.values.endDate ? dayjs(formik.values.endDate) : null
            }
            onChange={(date) => {
              formik.setFieldValue("endDate", date ? date.toISOString() : "");
            }}
            onBlur={() => formik.setFieldTouched("endDate", true)}
            status={
              formik.touched.endDate && formik.errors.endDate
                ? "error"
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
              formik.setFieldValue("capacity", val ?? undefined)
            }
            onBlur={() => formik.setFieldTouched("capacity", true)}
            status={
              formik.touched.capacity && formik.errors.capacity
                ? "error"
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
            onChange={(value) => formik.setFieldValue("status", value)}
            onBlur={() => formik.setFieldTouched("status", true)}
            status={
              formik.touched.status && formik.errors.status
                ? "error"
                : undefined
            }
            disabled={submitting}
            options={[
              { label: "Draft", value: "DRAFT" },
              { label: "Published", value: "PUBLISHED" },
              { label: "Cancelled", value: "CANCELLED" },
              { label: "Completed", value: "COMPLETED" },
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

      {/* Modal Action Buttons (Footer) */}
      <div className="flex items-center justify-end gap-2 border-t border-dim-grey-200 pt-4 mt-6">
        <Button key="cancel" onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          key="submit"
          type="primary"
          htmlType="submit"
          loading={submitting}
          disabled={!isFormChanged || !formik.isValid || submitting}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
}

export function EventFormModal({
  open,
  event,
  onClose,
}: EventFormModalProps): ReactElement {
  const { isSubmitting } = useAppSelector((state) => state.events);
  const isEdit = Boolean(event);
  const sessionKey = event ? event.id : "create";

  const titleText = isEdit ? "Edit Event" : "Create Event";
  const subtitleText = isEdit
    ? "Update event details, schedule, or status."
    : "Enter details to schedule and publish a new event.";

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold text-dim-grey-900">{titleText}</div>
          <div className="mt-0.5 text-xs font-normal text-dim-grey-500">
            {subtitleText}
          </div>
        </div>
      }
      open={open}
      onCancel={isSubmitting ? undefined : onClose}
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
      destroyOnHidden
      centered
      width={640}
      footer={null}
    >
      <EventFormModalContent
        key={sessionKey}
        event={event}
        onClose={onClose}
      />
    </Modal>
  );
}

export default EventFormModal;
