import type { ColumnsType } from 'antd/es/table';
import { Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/common';
import type { Permission } from '../../../../types/rbac.types.ts';
import { formatDate } from '../../../../utils/date.utils.ts';

export interface PermissionTableActionCallbacks {
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
}

export function getPermissionTableColumns({
  onEdit,
  onDelete,
}: PermissionTableActionCallbacks): ColumnsType<Permission> {
  return [
    {
      title: 'Permission Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color="blue" className="font-mono text-xs font-semibold">
          {name}
        </Tag>
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
      render: (_: unknown, record: Permission) => (
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
            danger
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
