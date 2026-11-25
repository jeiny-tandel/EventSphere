import { useEffect, useState, type ReactElement } from 'react';
import { Modal, Select } from 'antd';
import { useFormik } from 'formik';
import { Button, Input, TextArea } from '../../../../components/common';
import { getPermissionCategories } from '../../../../api/permissions.api.ts';
import {
  permissionValidationSchema,
  type PermissionFormValues,
} from '../../../../schemas/permissions.schema.ts';
import type { PermissionCategory } from '../../../../types/rbac.types.ts';
import { extractErrorMessage } from '../../../../utils/error.utils.ts';

export type PermissionFormMode = 'create' | 'edit';

export interface PermissionFormModalProps {
  open: boolean;
  mode: PermissionFormMode;
  initialValues?: {
    name: string;
    description?: string | null;
    categoryId?: string;
    category?: PermissionCategory;
    isSystem?: boolean;
  };
  onSubmit: (values: {
    name: string;
    description?: string;
    categoryId: string;
  }) => Promise<void>;
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
  const isSystemPermission =
    isEdit &&
    Boolean(
      (initialValues as { isSystem?: boolean } | undefined)?.isSystem,
    );

  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const loadCategories = async () => {
      try {
        const data = await getPermissionCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (err) {
        if (isMounted) {
          const errMsg = extractErrorMessage(
            err,
            'Failed to load permission categories.',
          );
          setCategoryError(errMsg);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    Promise.resolve().then(() => {
      if (isMounted) {
        setIsLoadingCategories(true);
        setCategoryError(null);
        void loadCategories();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const categoryOptions =
    categories.length > 0
      ? categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }))
      : initialValues?.category
        ? [
            {
              value: initialValues.category.id,
              label: initialValues.category.name,
            },
          ]
        : [];

  const formik = useFormik<PermissionFormValues>({
    initialValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      categoryId:
        initialValues?.categoryId ?? initialValues?.category?.id ?? '',
    },
    enableReinitialize: true,
    validationSchema: permissionValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const trimmedName = isSystemPermission
          ? (initialValues?.name ?? '').trim()
          : values.name.trim();
        const trimmedDescription = values.description?.trim();
        const trimmedCategoryId = values.categoryId.trim();

        await onSubmit({
          name: trimmedName,
          description: trimmedDescription || undefined,
          categoryId: trimmedCategoryId,
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
          disabled={!formik.dirty || !formik.isValid || submitting || isLoadingCategories}
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
            id={isEdit ? 'edit-permission-name' : 'permission-name'}
            name="name"
            label="Permission Name"
            placeholder="e.g. events.create"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={submitting || isSystemPermission}
            error={
              formik.touched.name && formik.errors.name
                ? formik.errors.name
                : undefined
            }
            required
          />
          {isSystemPermission && (
            <p className="mt-1 text-xs text-dim-grey-500">
              System permission names cannot be modified.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="permission-category"
            className="text-sm font-medium text-dim-grey-800"
          >
            Category <span className="text-powder-blush-500">*</span>
          </label>
          <Select
            id="permission-category"
            className="w-full"
            placeholder={
              isLoadingCategories
                ? 'Loading categories...'
                : categories.length === 0
                  ? 'No categories available'
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
            disabled={
              submitting ||
              isLoadingCategories ||
              (categories.length === 0 && !initialValues?.categoryId && !initialValues?.category)
            }
            loading={isLoadingCategories}
            showSearch
            optionFilterProp="label"
            options={categoryOptions}
          />
          {formik.touched.categoryId && formik.errors.categoryId && (
            <span className="text-xs text-powder-blush-500">
              {formik.errors.categoryId}
            </span>
          )}
          {categoryError && (
            <span className="text-xs text-powder-blush-500">
              {categoryError}
            </span>
          )}
        </div>

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
