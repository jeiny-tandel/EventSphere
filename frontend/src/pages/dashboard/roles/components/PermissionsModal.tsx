import { useMemo, useState, type ReactElement } from "react";
import { Alert, Checkbox, Empty, Modal, Spin, Tag } from "antd";
import { Button } from "../../../../components/common";
import type { Permission, Role } from "../../../../types/rbac.types.ts";

export interface PermissionsModalProps {
  open: boolean;
  role: Role | null;
  permissions: Permission[];
  initialPermissionIds: string[];
  isLoading: boolean;
  isLoaded: boolean;
  isSaving: boolean;
  error: string | null;
  onSave: (selectedPermissionIds: string[]) => Promise<void>;
  onClose: () => void;
  onRetryFetchPermissions: () => void;
}

export function PermissionsModal({
  open,
  role,
  permissions,
  initialPermissionIds,
  isLoading,
  isLoaded,
  isSaving,
  error,
  onSave,
  onClose,
  onRetryFetchPermissions,
}: PermissionsModalProps): ReactElement {
  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<string[]>(initialPermissionIds);

  const handleTogglePermission = (permissionId: string) => {
    if (isSaving) return;
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleToggleGroup = (groupPermissions: Permission[]) => {
    if (isSaving) return;
    const groupIds = groupPermissions.map((p) => p.id);
    const allSelected =
      groupIds.length > 0 &&
      groupIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !groupIds.includes(id)),
      );
    } else {
      setSelectedPermissionIds((prev) => [
        ...prev,
        ...groupIds.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const hasPermissionChanges = useMemo(() => {
    if (selectedPermissionIds.length !== initialPermissionIds.length) {
      return true;
    }
    const initialSet = new Set(initialPermissionIds);
    return selectedPermissionIds.some((id) => !initialSet.has(id));
  }, [selectedPermissionIds, initialPermissionIds]);

  const permissionGroups = useMemo(() => {
    const map = new Map<string, Permission[]>();

    for (const perm of permissions) {
      const parts = perm.name.split(".");
      const groupKey = parts.length > 1 ? parts[0] : "general";
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(perm);
    }

    return Array.from(map.entries()).map(([name, groupPerms]) => ({
      name,
      permissions: groupPerms,
    }));
  }, [permissions]);

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold text-dim-grey-900">
            Manage Permissions
          </div>
          <div className="mt-0.5 text-xs font-normal text-dim-grey-500">
            Configure assigned permissions for{" "}
            <span className="font-semibold text-dim-grey-800 capitalize">
              {role?.name}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={isSaving ? undefined : onClose}
      closable={!isSaving}
      maskClosable={!isSaving}
      destroyOnClose
      centered
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSaving}
          disabled={!hasPermissionChanges || isSaving}
          onClick={() => onSave(selectedPermissionIds)}
        >
          Save Changes
        </Button>,
      ]}
    >
      <div className="py-2">
        {isLoading && !isLoaded ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spin tip="Loading permissions..." />
          </div>
        ) : error && !isLoaded ? (
          <Alert
            type="error"
            message="Failed to load permissions"
            description={error}
            showIcon
            action={
              <Button className="text-xs!" onClick={onRetryFetchPermissions}>
                Retry
              </Button>
            }
          />
        ) : permissions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-sm text-dim-grey-500">
                No permissions available.
              </span>
            }
          />
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-0.5 text-xs text-dim-grey-500">
              <span>
                Select the permissions that should be granted to this role.
              </span>
              <span className="font-medium text-dim-grey-700">
                {selectedPermissionIds.length} of {permissions.length} total
                selected
              </span>
            </div>
            {permissionGroups.map((group) => {
              const groupIds = group.permissions.map((p) => p.id);
              const isAllSelected =
                groupIds.length > 0 &&
                groupIds.every((id) => selectedPermissionIds.includes(id));
              const isSomeSelected =
                groupIds.some((id) => selectedPermissionIds.includes(id)) &&
                !isAllSelected;
              const groupSelectedCount = groupIds.filter((id) =>
                selectedPermissionIds.includes(id),
              ).length;

              return (
                <div
                  key={group.name}
                  className="rounded-lg border border-dim-grey-200 bg-white p-3.5 shadow-2xs"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-dim-grey-100 pb-2">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      disabled={isSaving}
                      onChange={() => handleToggleGroup(group.permissions)}
                    >
                      <span className="text-xs font-semibold tracking-wider text-dim-grey-800 uppercase">
                        {group.name}
                      </span>
                    </Checkbox>
                    <Tag className="text-[11px] font-normal text-dim-grey-500">
                      {groupSelectedCount} / {group.permissions.length} selected
                    </Tag>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissionIds.includes(perm.id);
                      const isInitiallyAssigned = initialPermissionIds.includes(
                        perm.id,
                      );

                      return (
                        <div
                          key={perm.id}
                          className={`flex items-start gap-2.5 rounded-md border p-2.5 transition-colors ${
                            isSaving
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer"
                          } ${
                            isChecked
                              ? "border-peach-fuzz-400 bg-peach-fuzz-50/50"
                              : "border-dim-grey-200 bg-white hover:border-dim-grey-300"
                          }`}
                          onClick={() => handleTogglePermission(perm.id)}
                        >
                          <Checkbox
                            checked={isChecked}
                            disabled={isSaving}
                            onChange={() => handleTogglePermission(perm.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-dim-grey-900">
                                {perm.name}
                              </span>
                              {isInitiallyAssigned && (
                                <Tag
                                  color="default"
                                  className="px-1 py-0 text-[10px] leading-4"
                                >
                                  Assigned
                                </Tag>
                              )}
                            </div>
                            {perm.description && (
                              <p className="mt-0.5 text-xs text-dim-grey-500 line-clamp-2">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default PermissionsModal;
