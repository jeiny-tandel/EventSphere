import type { ColumnsType } from 'antd/es/table';
import { Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/common';
import type { Permission } from '../../../../types/rbac.types.ts';
import { formatDate } from '../../../../utils';

export interface PermissionTableActionCallbacks {
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function getPermissionTableColumns({
  onEdit,
  onDelete,
  canUpdate = false,
  canDelete = false,
}: PermissionTableActionCallbacks): ColumnsType<Permission> {
  const columns: ColumnsType<Permission> = [
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
      title: 'Category',
      key: 'category',
      render: (_: unknown, record: Permission) => {
        const categoryName = record.category?.name;
        return categoryName ? (
          <Tag color="purple" className="font-medium">
            {categoryName}
          </Tag>
        ) : (
          <span className="italic text-dim-grey-400">—</span>
        );
      },
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
  ];

  if (canUpdate || canDelete) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Permission) => {
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
            {canDelete && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700!"
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
