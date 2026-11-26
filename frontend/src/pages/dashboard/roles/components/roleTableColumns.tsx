import type { ColumnsType } from 'antd/es/table';
import { Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/common';
import type { Role } from '../../../../types/rbac.types.ts';
import { formatDate } from '../../../../utils';

export interface RoleTableActionCallbacks {
  onEdit: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  onDelete: (role: Role) => void;
  canUpdate?: boolean;
  canAssignPermissions?: boolean;
  canDelete?: boolean;
}

export function getRoleTableColumns({
  onEdit,
  onManagePermissions,
  onDelete,
  canUpdate = false,
  canAssignPermissions = false,
  canDelete = false,
}: RoleTableActionCallbacks): ColumnsType<Role> {
  const columns: ColumnsType<Role> = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-semibold text-dim-grey-900 capitalize">
          {name}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) =>
        description && description.trim().length > 0 ? (
          <span className="text-dim-grey-700">{description}</span>
        ) : (
          <span className="italic text-dim-grey-400">No description</span>
        ),
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_: unknown, record: Role) => {
        const count = record.permissions?.length ?? 0;
        return (
          <Tag
            color={count > 0 ? 'orange' : 'default'}
            className="font-medium"
          >
            {count} {count === 1 ? 'permission' : 'permissions'}
          </Tag>
        );
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(createdAt)}
        </span>
      ),
    },
  ];

  if (canUpdate || canAssignPermissions || canDelete) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Role) => {
        const isSystem = Boolean((record as { isSystem?: boolean }).isSystem);
        const canDeleteThisRole = canDelete && !isSystem;

        return (
          <Space size="middle">
            {canUpdate && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs!"
                onClick={() => onEdit(record)}
              >
                <EditOutlined /> Edit
              </Button>
            )}
            {canAssignPermissions && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs!"
                onClick={() => onManagePermissions(record)}
              >
                <KeyOutlined /> Permissions
              </Button>
            )}
            {canDeleteThisRole && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs!"
                onClick={() => onDelete(record)}
              >
                <DeleteOutlined /> Delete
              </Button>
            )}
          </Space>
        );
      },
    });
  }

  return columns;
}
