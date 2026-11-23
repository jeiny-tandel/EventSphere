import type { ColumnsType } from 'antd/es/table';
import { Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/common';
import type { Role } from '../../../../types/rbac.types.ts';
import { formatDate } from '../../../../utils/date.utils.ts';

export interface RoleTableActionCallbacks {
  onEdit: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export function getRoleTableColumns({
  onEdit,
  onManagePermissions,
  onDelete,
}: RoleTableActionCallbacks): ColumnsType<Role> {
  return [
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <Space size="middle">
          <Button
            type="text"
            className="flex! items-center gap-1 text-xs!"
            onClick={() => onEdit(record)}
          >
            <EditOutlined /> Edit
          </Button>
          <Button
            type="text"
            className="flex! items-center gap-1 text-xs!"
            onClick={() => onManagePermissions(record)}
          >
            <KeyOutlined /> Permissions
          </Button>
          <Button
            type="text"
            className="flex! items-center gap-1 text-xs!"
            onClick={() => onDelete(record)}
          >
            <DeleteOutlined /> Delete
          </Button>
        </Space>
      ),
    },
  ];
}
