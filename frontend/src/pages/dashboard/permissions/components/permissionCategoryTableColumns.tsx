import type { ColumnsType } from 'antd/es/table';
import { Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/common';
import type { PermissionCategory } from '../../../../types/rbac.types.ts';
import { formatDate } from '../../../../utils';

export interface PermissionCategoryTableActionCallbacks {
  onEdit: (category: PermissionCategory) => void;
  onDelete: (category: PermissionCategory) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function getPermissionCategoryTableColumns({
  onEdit,
  onDelete,
  canUpdate = false,
  canDelete = false,
}: PermissionCategoryTableActionCallbacks): ColumnsType<PermissionCategory> {
  const columns: ColumnsType<PermissionCategory> = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color="purple" className="font-semibold text-xs">
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
      title: 'Permissions',
      key: 'permissionsCount',
      render: (_: unknown, record: PermissionCategory) => {
        const count = record._count?.permissions ?? 0;
        return (
          <Tag
            color={count > 0 ? 'blue' : 'default'}
            className="font-medium text-xs"
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

  if (canUpdate || canDelete) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PermissionCategory) => {
        const permissionsCount = record._count?.permissions ?? 0;
        const hasPermissions = permissionsCount > 0;

        const deleteButton = (
          <Button
            type="text"
            className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700!"
            onClick={() => onDelete(record)}
            disabled={hasPermissions}
          >
            <DeleteOutlined /> Delete
          </Button>
        );

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
            {canDelete &&
              (hasPermissions ? (
                <Tooltip title="Categories with associated permissions cannot be deleted">
                  <span className="inline-block cursor-not-allowed">
                    {deleteButton}
                  </span>
                </Tooltip>
              ) : (
                deleteButton
              ))}
          </Space>
        );
      },
    });
  }

  return columns;
}
