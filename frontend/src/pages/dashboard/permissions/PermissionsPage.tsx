import { useEffect, useRef, useState, type ReactElement } from "react";
import { Alert, Empty, Modal, Table, Tabs, message } from "antd";
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import {
  createNewPermission,
  createPermissionCategory,
  deletePermissionCategory,
  fetchPermissionCategories,
  fetchPermissions,
  removePermission,
  updateExistingPermission,
  updatePermissionCategory,
} from "../../../store/slices/permissionSlice.ts";
import type {
  CreatePermissionCategoryPayload,
  CreatePermissionPayload,
  Permission,
  PermissionCategory,
  UpdatePermissionCategoryPayload,
  UpdatePermissionPayload,
} from "../../../types/rbac.types.ts";
import { extractErrorMessage } from "../../../utils/error.utils.ts";
import { hasPermission } from "../../../utils/permission.utils.ts";
import {
  PermissionCategoryFormModal,
  PermissionFormModal,
  getPermissionCategoryTableColumns,
  getPermissionTableColumns,
} from "./components";

export function PermissionsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    permissions,
    categories,
    isLoading,
    isLoaded,
    categoriesLoading,
    error,
    categoriesError,
  } = useAppSelector((state) => state.permissions);

  const canCreate = hasPermission(user, "permissions.create");
  const canUpdate = hasPermission(user, "permissions.update");
  const canDelete = hasPermission(user, "permissions.delete");

  const [activeTab, setActiveTab] = useState<string>("permissions");
  const hasFetchedCategoriesRef = useRef(false);

  // Permission Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );

  // Category Modals State
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [editingCategory, setEditingCategory] =
    useState<PermissionCategory | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      dispatch(fetchPermissions());
    }
  }, [dispatch, isLoaded]);

  useEffect(() => {
    if (
      activeTab === "categories" &&
      !hasFetchedCategoriesRef.current &&
      !categoriesLoading
    ) {
      hasFetchedCategoriesRef.current = true;
      dispatch(fetchPermissionCategories());
    }
  }, [activeTab, categoriesLoading, dispatch]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // --- Permission Handlers ---
  const handleCreatePermission = async (payload: CreatePermissionPayload) => {
    try {
      await dispatch(createNewPermission(payload)).unwrap();
      message.success("Permission created successfully.");
      setIsCreateModalOpen(false);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to create permission. Please try again.",
      );
      message.error(errorMessage);
      throw err;
    }
  };

  const handleEditPermission = async (payload: UpdatePermissionPayload) => {
    if (!editingPermission) return;
    try {
      await dispatch(
        updateExistingPermission({ id: editingPermission.id, data: payload }),
      ).unwrap();
      message.success(
        `Permission "${payload.name ?? editingPermission.name}" updated successfully.`,
      );
      setEditingPermission(null);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to update permission. Please try again.",
      );
      message.error(errorMessage);
      throw err;
    }
  };

  const handleDeletePermission = (permission: Permission) => {
    Modal.confirm({
      title: "Delete Permission",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the permission "${permission.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(removePermission(permission.id)).unwrap();
          message.success(
            `Permission "${permission.name}" deleted successfully.`,
          );
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to delete permission. Please try again.",
          );

          const lowerMessage = errorMessage.toLowerCase();
          const isRoleAssignmentConflict = lowerMessage.includes(
            "assigned to one or more roles",
          );

          if (isRoleAssignmentConflict) {
            message.error(
              "This permission is assigned to one or more roles. Remove it from all assigned roles before deleting it.",
            );
          } else {
            message.error(errorMessage);
          }
        }
      },
    });
  };

  // --- Category Handlers ---
  const handleCreateCategory = async (
    payload: CreatePermissionCategoryPayload | UpdatePermissionCategoryPayload,
  ) => {
    try {
      await dispatch(
        createPermissionCategory(payload as CreatePermissionCategoryPayload),
      ).unwrap();
      message.success("Permission category created successfully.");
      setIsCreateCategoryModalOpen(false);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to create permission category. Please try again.",
      );
      message.error(errorMessage);
      throw err;
    }
  };

  const handleEditCategory = async (
    payload: CreatePermissionCategoryPayload | UpdatePermissionCategoryPayload,
  ) => {
    if (!editingCategory) return;
    try {
      await dispatch(
        updatePermissionCategory({
          id: editingCategory.id,
          data: payload as UpdatePermissionCategoryPayload,
        }),
      ).unwrap();
      message.success(
        `Category "${payload.name ?? editingCategory.name}" updated successfully.`,
      );
      setEditingCategory(null);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to update permission category. Please try again.",
      );
      message.error(errorMessage);
      throw err;
    }
  };

  const handleDeleteCategory = (category: PermissionCategory) => {
    Modal.confirm({
      title: "Delete Category",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(deletePermissionCategory(category.id)).unwrap();
          message.success(`Category "${category.name}" deleted successfully.`);
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to delete permission category. Please try again.",
          );

          const lowerMessage = errorMessage.toLowerCase();
          const isAssociatedPermissionsConflict =
            lowerMessage.includes("associated with") ||
            lowerMessage.includes("permission");

          if (isAssociatedPermissionsConflict) {
            message.error(
              "This category is associated with existing permissions. Please reassign or delete the permissions first.",
            );
          } else {
            message.error(errorMessage);
          }
        }
      },
    });
  };

  const permissionColumns = getPermissionTableColumns({
    onEdit: (permission) => setEditingPermission(permission),
    onDelete: handleDeletePermission,
    canUpdate,
    canDelete,
  });

  const categoryColumns = getPermissionCategoryTableColumns({
    onEdit: (category) => setEditingCategory(category),
    onDelete: handleDeleteCategory,
    canUpdate,
    canDelete,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Manage system permissions and control available access capabilities."
        actions={
          activeTab === "permissions" && canCreate ? (
            <Button
              type="primary"
              className="flex! items-center gap-1.5"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusOutlined />
              <span>Create Permission</span>
            </Button>
          ) : undefined
        }
      />

      {/* Error Alert State - Permissions */}
      {activeTab === "permissions" && error && !isLoading && (
        <Alert
          type="error"
          message="Failed to load permissions"
          description={error}
          showIcon
          action={
            <Button
              className="text-xs!"
              onClick={() => dispatch(fetchPermissions())}
            >
              Retry
            </Button>
          }
        />
      )}

      {/* Error Alert State - Categories */}
      {activeTab === "categories" && categoriesError && !categoriesLoading && (
        <Alert
          type="error"
          message="Failed to load permission categories"
          description={categoriesError}
          showIcon
          action={
            <Button
              className="text-xs!"
              onClick={() => dispatch(fetchPermissionCategories())}
            >
              Retry
            </Button>
          }
        />
      )}

      {/* Navigation Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "permissions",
            label: "Permissions",
            children: (
              <Card
                className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
                bodyClassName="!p-0"
              >
                <Table<Permission>
                  rowKey="id"
                  columns={permissionColumns}
                  dataSource={permissions}
                  loading={isLoading}
                  scroll={{ x: 700 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    responsive: true,
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-sm text-dim-grey-500">
                            No permissions found.
                          </span>
                        }
                      />
                    ),
                  }}
                />
              </Card>
            ),
          },
          {
            key: "categories",
            label: "Categories",
            children: (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-dim-grey-900">
                      Permission Categories
                    </h3>
                    <p className="text-xs text-dim-grey-500">
                      Manage categories used to group and classify system permissions.
                    </p>
                  </div>
                  {canCreate && (
                    <Button
                      type="primary"
                      className="flex! items-center gap-1.5"
                      onClick={() => setIsCreateCategoryModalOpen(true)}
                    >
                      <PlusOutlined />
                      <span>Create Category</span>
                    </Button>
                  )}
                </div>

                <Card
                  className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
                  bodyClassName="!p-0"
                >
                  <Table<PermissionCategory>
                    rowKey="id"
                    columns={categoryColumns}
                    dataSource={categories}
                    loading={categoriesLoading}
                    scroll={{ x: 700 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      responsive: true,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-sm text-dim-grey-500">
                              No categories found.
                            </span>
                          }
                        />
                      ),
                    }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* Create Permission Modal */}
      <PermissionFormModal
        mode="create"
        open={isCreateModalOpen}
        onSubmit={handleCreatePermission}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Permission Modal */}
      {editingPermission && (
        <PermissionFormModal
          key={editingPermission.id}
          mode="edit"
          open={Boolean(editingPermission)}
          initialValues={editingPermission}
          onSubmit={handleEditPermission}
          onClose={() => setEditingPermission(null)}
        />
      )}

      {/* Create Category Modal */}
      <PermissionCategoryFormModal
        mode="create"
        open={isCreateCategoryModalOpen}
        onSubmit={handleCreateCategory}
        onClose={() => setIsCreateCategoryModalOpen(false)}
      />

      {/* Edit Category Modal */}
      {editingCategory && (
        <PermissionCategoryFormModal
          key={editingCategory.id}
          mode="edit"
          open={Boolean(editingCategory)}
          category={editingCategory}
          onSubmit={handleEditCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

export default PermissionsPage;
