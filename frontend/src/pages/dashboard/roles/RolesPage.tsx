import { useEffect, useState, type ReactElement } from "react";
import { Alert, Empty, Modal, Table, message } from "antd";
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import { fetchPermissions } from "../../../store/slices/permissionSlice.ts";
import {
  assignPermissionsToRole,
  createNewRole,
  fetchRoles,
  removePermissionsFromRole,
  removeRole,
  updateExistingRole,
} from "../../../store/slices/roleSlice.ts";
import type {
  CreateRolePayload,
  Role,
  UpdateRolePayload,
} from "../../../types/rbac.types.ts";
import {
  PermissionsModal,
  RoleFormModal,
  getRoleTableColumns,
} from "./components";

export function RolesPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { roles, isLoading, isLoaded, error } = useAppSelector(
    (state) => state.roles,
  );
  const {
    permissions,
    isLoading: isPermissionsLoading,
    isLoaded: isPermissionsLoaded,
    error: permissionsError,
  } = useAppSelector((state) => state.permissions);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] =
    useState<Role | null>(null);
  const [initialPermissionIds, setInitialPermissionIds] = useState<string[]>(
    [],
  );
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      dispatch(fetchRoles());
    }
  }, [dispatch, isLoaded]);

  const handleCreateRole = async (payload: CreateRolePayload) => {
    try {
      await dispatch(createNewRole(payload)).unwrap();
      message.success("Role created successfully.");
      setIsCreateModalOpen(false);
    } catch (err) {
      const errorMessage =
        typeof err === "string"
          ? err
          : "Failed to create role. Please try again.";
      message.error(errorMessage);
      throw err;
    }
  };

  const handleEditRole = async (payload: UpdateRolePayload) => {
    if (!editingRole) return;
    try {
      await dispatch(
        updateExistingRole({ id: editingRole.id, data: payload }),
      ).unwrap();
      message.success(`Role "${payload.name}" updated successfully.`);
      setEditingRole(null);
    } catch (err) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err instanceof Error && err.message
            ? err.message
            : "Failed to update role. Please try again.";
      message.error(errorMessage);
      throw err;
    }
  };

  const handleDeleteRole = (role: Role) => {
    Modal.confirm({
      title: "Delete Role",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(removeRole(role.id)).unwrap();
          message.success(`Role "${role.name}" deleted successfully.`);
        } catch (err) {
          const errorMessage =
            typeof err === "string"
              ? err
              : err instanceof Error && err.message
                ? err.message
                : "Failed to delete role. Please try again.";

          const lowerMessage = errorMessage.toLowerCase();
          const isConflict =
            lowerMessage.includes("assigned to users") ||
            lowerMessage.includes("linked permissions") ||
            lowerMessage.includes("conflict");

          if (isConflict) {
            message.error(
              `Cannot delete role "${role.name}" because it is assigned to users or has linked permissions. Please remove these associations first.`,
            );
          } else {
            message.error(errorMessage);
          }
        }
      },
    });
  };

  const handleOpenPermissionsModal = (role: Role) => {
    setSelectedRoleForPermissions(role);
    const assignedIds = [
      ...new Set(
        (role.permissions || [])
          .map((rp) => rp.permissionId || rp.permission?.id)
          .filter(Boolean),
      ),
    ];
    setInitialPermissionIds(assignedIds);

    if (!isPermissionsLoaded && !isPermissionsLoading && !permissionsError) {
      dispatch(fetchPermissions());
    }
  };

  const handleClosePermissionsModal = () => {
    if (isSavingPermissions) return;
    setSelectedRoleForPermissions(null);
    setInitialPermissionIds([]);
  };

  const handleSavePermissions = async (selectedPermissionIds: string[]) => {
    if (!selectedRoleForPermissions || isSavingPermissions) return;

    const toAdd = selectedPermissionIds.filter(
      (id) => !initialPermissionIds.includes(id),
    );
    const toRemove = initialPermissionIds.filter(
      (id) => !selectedPermissionIds.includes(id),
    );

    if (toAdd.length === 0 && toRemove.length === 0) {
      handleClosePermissionsModal();
      return;
    }

    setIsSavingPermissions(true);
    let additionsSucceeded = false;

    try {
      // 1. Dispatch assign permissions if toAdd is not empty
      if (toAdd.length > 0) {
        await dispatch(
          assignPermissionsToRole({
            id: selectedRoleForPermissions.id,
            payload: { permissionIds: toAdd },
          }),
        ).unwrap();
        additionsSucceeded = true;
        // Keep initial assignments in sync with the applied additions in case removals fail next
        setInitialPermissionIds((prev) => [...new Set([...prev, ...toAdd])]);
      }

      // 2. Dispatch remove permissions if toRemove is not empty
      if (toRemove.length > 0) {
        await dispatch(
          removePermissionsFromRole({
            id: selectedRoleForPermissions.id,
            payload: { permissionIds: toRemove },
          }),
        ).unwrap();
      }

      message.success(
        `Permissions for role "${selectedRoleForPermissions.name}" updated successfully.`,
      );
      handleClosePermissionsModal();
    } catch (err) {
      let errorMessage = "Failed to update permissions. Please try again.";
      if (typeof err === "string") {
        errorMessage = err;
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      if (additionsSucceeded) {
        message.error(
          `Failed to remove permissions: ${errorMessage}. However, newly assigned permissions were already applied. Please review the role's current permissions before retrying.`,
          6,
        );
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const columns = getRoleTableColumns({
    onEdit: (role) => setEditingRole(role),
    onManagePermissions: handleOpenPermissionsModal,
    onDelete: handleDeleteRole,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles Management"
        description="Manage application roles and their assigned permissions."
        actions={
          <Button
            type="primary"
            className="flex! items-center gap-1.5"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusOutlined />
            <span>Create Role</span>
          </Button>
        }
      />

      {/* Error Alert State */}
      {error && !isLoading && (
        <Alert
          type="error"
          message="Failed to load roles"
          description={error}
          showIcon
          action={
            <Button className="text-xs!" onClick={() => dispatch(fetchRoles())}>
              Retry
            </Button>
          }
        />
      )}

      {/* Roles Table Card */}
      <Card
        className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-0"
      >
        <Table<Role>
          rowKey="id"
          columns={columns}
          dataSource={roles}
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
                    No roles found.
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Create Role Modal */}
      <RoleFormModal
        mode="create"
        open={isCreateModalOpen}
        onSubmit={handleCreateRole}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Role Modal */}
      <RoleFormModal
        mode="edit"
        open={Boolean(editingRole)}
        initialValues={editingRole ?? undefined}
        onSubmit={handleEditRole}
        onClose={() => setEditingRole(null)}
      />

      {/* Manage Permissions Modal */}
      {selectedRoleForPermissions && (
        <PermissionsModal
          key={selectedRoleForPermissions.id}
          open={Boolean(selectedRoleForPermissions)}
          role={selectedRoleForPermissions}
          permissions={permissions}
          initialPermissionIds={initialPermissionIds}
          isLoading={isPermissionsLoading}
          isLoaded={isPermissionsLoaded}
          isSaving={isSavingPermissions}
          error={permissionsError}
          onSave={handleSavePermissions}
          onClose={handleClosePermissionsModal}
          onRetryFetchPermissions={() => dispatch(fetchPermissions())}
        />
      )}
    </div>
  );
}

export default RolesPage;
