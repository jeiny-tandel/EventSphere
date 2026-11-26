import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Alert, Empty, Input, Modal, Select, Table, message } from "antd";
import { ExclamationCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import { fetchRoles } from "../../../store/slices/roleSlice.ts";
import {
  assignRoleToUser,
  fetchUsers,
  updateExistingUser,
  updateExistingUserStatus,
} from "../../../store/slices/userSlice.ts";
import type { UpdateUserPayload, User } from "../../../types/user.types.ts";
import { extractErrorMessage, hasPermission } from "../../../utils";
import {
  AssignRoleModal,
  UserFormModal,
  getUserTableColumns,
} from "./components";

type StatusFilter = "all" | "active" | "inactive";

export function UsersPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { users, isLoading, isLoaded, isSubmitting, error } = useAppSelector(
    (state) => state.user,
  );
  const {
    roles,
    isLoading: isLoadingRoles,
    isLoaded: isRolesLoaded,
  } = useAppSelector((state) => state.roles);

  const canUpdate = hasPermission(user, "users.update");
  const canAssignRole = hasPermission(user, "users.assign_role");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
    null,
  );

  useEffect(() => {
    if (!isLoaded) {
      dispatch(fetchUsers());
    }
  }, [dispatch, isLoaded]);

  // Combined client-side filtering for search query and status filter
  const filteredUsers = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      // 1. Status Filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      if (!matchesStatus) return false;

      // 2. Search Filter (first name, last name, full name, email)
      if (!trimmedSearch) return true;

      const firstName = user.firstName.toLowerCase();
      const lastName = user.lastName.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
      const email = user.email.toLowerCase();

      return (
        firstName.includes(trimmedSearch) ||
        lastName.includes(trimmedSearch) ||
        fullName.includes(trimmedSearch) ||
        email.includes(trimmedSearch)
      );
    });
  }, [users, searchTerm, statusFilter]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (id: string, values: UpdateUserPayload) => {
    try {
      const updatedUser = await dispatch(
        updateExistingUser({ id, data: values }),
      ).unwrap();

      const userDisplayName =
        [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ").trim() ||
        updatedUser.email;

      message.success(`User "${userDisplayName}" updated successfully.`);
      setEditingUser(null);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to update user. Please try again.",
      );
      message.error(errorMessage);
      throw err;
    }
  };

  const handleOpenAssignRoleModal = async (user: User) => {
    setSelectedUserForRole(user);
    if (!isRolesLoaded && !isLoadingRoles) {
      try {
        await dispatch(fetchRoles()).unwrap();
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          "Failed to load roles. Please try again.",
        );
        message.error(errorMessage);
      }
    }
  };

  const handleAssignRoleSubmit = async (userId: string, roleId: string) => {
    try {
      const updatedUser = await dispatch(
        assignRoleToUser({ id: userId, data: { roleId } }),
      ).unwrap();

      const userDisplayName =
        [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ").trim() ||
        updatedUser.email;

      const roleName = updatedUser.role?.name ?? "selected role";

      message.success(
        `Role "${roleName}" assigned to "${userDisplayName}" successfully.`,
      );
      setSelectedUserForRole(null);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to assign role. Please try again.",
      );
      message.error(errorMessage);
      throw err;
    }
  };

  const handleActivateUser = (user: User) => {
    if (user.isActive || isSubmitting) return;

    const userDisplayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email;

    Modal.confirm({
      title: "Activate User",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to activate user "${userDisplayName}"? Activating this account will restore the user's ability to log into the platform.`,
      okText: "Activate",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(
            updateExistingUserStatus({ id: user.id, data: { isActive: true } }),
          ).unwrap();
          message.success(`User "${userDisplayName}" activated successfully.`);
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to activate user. Please try again.",
          );
          message.error(errorMessage);
        }
      },
    });
  };

  const handleDeactivateUser = (user: User) => {
    if (!user.isActive || isSubmitting) return;

    const userDisplayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email;

    Modal.confirm({
      title: "Deactivate User",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to deactivate user "${userDisplayName}"? Deactivating will prevent this user from logging into the platform. Please note that the system does not currently provide a reactivation option.`,
      okText: "Deactivate",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(
            updateExistingUserStatus({
              id: user.id,
              data: { isActive: false },
            }),
          ).unwrap();
          message.success(
            `User "${userDisplayName}" deactivated successfully.`,
          );
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to deactivate user. Please try again.",
          );
          message.error(errorMessage);
        }
      },
    });
  };

  const columns = getUserTableColumns({
    onEdit: handleEditUser,
    onAssignRole: handleOpenAssignRoleModal,
    onActivate: handleActivateUser,
    onDeactivate: handleDeactivateUser,
    canUpdate,
    canAssignRole,
  });

  const isFiltered = Boolean(searchTerm.trim()) || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage registered users, update profile details, and control role assignments."
      />

      {/* Error Alert State */}
      {error && !isLoading && (
        <Alert
          type="error"
          message="Failed to load users"
          description={error}
          showIcon
          action={
            <Button className="text-xs!" onClick={() => dispatch(fetchUsers())}>
              Retry
            </Button>
          }
        />
      )}

      {/* Users Table Card */}
      <Card
        className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-0"
      >
        {/* Search and Status Filter Toolbar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-dim-grey-100">
          <Input
            placeholder="Search by name or email..."
            prefix={<SearchOutlined className="text-dim-grey-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="w-full sm:max-w-xs"
          />
          <Select<StatusFilter>
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            className="w-full sm:w-40"
            options={[
              { value: "all", label: "All Users" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        <Table<User>
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={isLoading}
          scroll={{ x: 800 }}
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
                    {error || !isLoaded
                      ? "Unable to load users."
                      : isFiltered
                        ? "No users match the search or filter criteria."
                        : "No users found."}
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Edit User Modal */}
      <UserFormModal
        open={Boolean(editingUser)}
        user={editingUser}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdateUser}
        onCancel={() => setEditingUser(null)}
      />

      {/* Assign Role Modal */}
      <AssignRoleModal
        open={Boolean(selectedUserForRole)}
        user={selectedUserForRole}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
        isSubmitting={isSubmitting}
        onSubmit={handleAssignRoleSubmit}
        onCancel={() => setSelectedUserForRole(null)}
      />
    </div>
  );
}

export default UsersPage;
