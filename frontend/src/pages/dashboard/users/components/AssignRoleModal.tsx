import { useState, type ReactElement } from 'react';
import { Modal, Select, Spin, Tag } from 'antd';
import { Button } from '../../../../components/common';
import type { Role } from '../../../../types/rbac.types.ts';
import type { User } from '../../../../types/user.types.ts';

export interface AssignRoleModalProps {
  open: boolean;
  user: User | null;
  roles: Role[];
  isLoadingRoles: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (userId: string, roleId: string) => void | Promise<void>;
}

export function AssignRoleModal({
  open,
  user,
  roles,
  isLoadingRoles,
  isSubmitting,
  onCancel,
  onSubmit,
}: AssignRoleModalProps): ReactElement {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    user?.roleId ?? null,
  );
  const [prevUser, setPrevUser] = useState<User | null>(user);
  const [prevOpen, setPrevOpen] = useState<boolean>(open);

  // Sync state if user or modal open state changes
  if (open !== prevOpen || user !== prevUser) {
    setPrevOpen(open);
    setPrevUser(user);
    setSelectedRoleId(user?.roleId ?? null);
  }

  const isRoleChanged = Boolean(
    selectedRoleId && selectedRoleId !== (user?.roleId ?? null),
  );
  const canSubmit =
    isRoleChanged && !isSubmitting && !isLoadingRoles && Boolean(user);

  const handleCancel = () => {
    if (isSubmitting) return;
    setSelectedRoleId(user?.roleId ?? null);
    onCancel();
  };

  const handleSubmit = async () => {
    if (!user || !selectedRoleId || !canSubmit) return;
    try {
      await onSubmit(user.id, selectedRoleId);
    } catch {
      // Errors handled by parent/caller
    }
  };

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || '—'
    : '—';

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold text-dim-grey-900">Assign Role</div>
          <div className="mt-0.5 text-xs font-normal text-dim-grey-500">
            Configure assigned role for this user.
          </div>
        </div>
      }
      open={open}
      onCancel={isSubmitting ? undefined : handleCancel}
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
      destroyOnClose
      centered
      footer={[
        <Button
          key="cancel"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Assign Role
        </Button>,
      ]}
    >
      <div className="space-y-4 py-2">
        {/* User Details Banner */}
        <div className="rounded-lg border border-dim-grey-200 bg-dim-grey-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wider text-dim-grey-500">
            User Details
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-semibold text-dim-grey-900">{fullName}</span>
            <span className="text-xs text-dim-grey-600">{user?.email || '—'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-dim-grey-600">
            <span>Current Role:</span>
            {user?.role?.name ? (
              <Tag color="blue" className="font-medium capitalize">
                {user.role.name}
              </Tag>
            ) : (
              <span className="italic text-dim-grey-400">No role assigned</span>
            )}
          </div>
        </div>

        {/* Role Selection */}
        {isLoadingRoles ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Spin tip="Loading roles..." />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label
              htmlFor="assign-role-select"
              className="text-sm font-medium text-dim-grey-800"
            >
              New Role <span className="text-powder-blush-500">*</span>
            </label>
            <Select
              id="assign-role-select"
              className="w-full"
              placeholder={
                roles.length === 0 ? 'No roles available' : 'Select a role'
              }
              value={selectedRoleId}
              onChange={(value) => setSelectedRoleId(value)}
              disabled={isSubmitting || roles.length === 0}
              showSearch
              optionFilterProp="label"
              options={roles.map((role) => ({
                value: role.id,
                label: role.name,
              }))}
            />
            {roles.length === 0 && (
              <p className="text-xs text-dim-grey-500">
                No roles found in the system.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AssignRoleModal;
