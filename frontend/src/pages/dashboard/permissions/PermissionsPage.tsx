import { useEffect, useState, type ReactElement } from "react";
import { Alert, Empty, Modal, Table, message } from "antd";
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import {
  createNewPermission,
  fetchPermissions,
  removePermission,
  updateExistingPermission,
} from "../../../store/slices/permissionSlice.ts";
import type {
  CreatePermissionPayload,
  Permission,
  UpdatePermissionPayload,
} from "../../../types/rbac.types.ts";
import { extractErrorMessage } from "../../../utils/error.utils.ts";
import {
  PermissionFormModal,
  getPermissionTableColumns,
} from "./components";

export function PermissionsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { permissions, isLoading, isLoaded, error } = useAppSelector(
    (state) => state.permissions,
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );

  useEffect(() => {
    if (!isLoaded) {
      dispatch(fetchPermissions());
    }
  }, [dispatch, isLoaded]);

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

  const columns = getPermissionTableColumns({
    onEdit: (permission) => setEditingPermission(permission),
    onDelete: handleDeletePermission,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Manage system permissions and control available access capabilities."
        actions={
          <Button
            type="primary"
            className="flex! items-center gap-1.5"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusOutlined />
            <span>Create Permission</span>
          </Button>
        }
      />

      {/* Error Alert State */}
      {error && !isLoading && (
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

      {/* Permissions Table Card */}
      <Card
        className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-0"
      >
        <Table<Permission>
          rowKey="id"
          columns={columns}
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
    </div>
  );
}

export default PermissionsPage;
