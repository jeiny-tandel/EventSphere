import type { ColumnsType } from 'antd/es/table';
import { Space, Tag } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button } from '../../../../components/common';
import type { User } from '../../../../types/user.types.ts';
import { formatDate } from '../../../../utils';

export interface UserTableActionCallbacks {
  onEdit: (user: User) => void;
  onAssignRole: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  canUpdate?: boolean;
  canAssignRole?: boolean;
}

export function getUserTableColumns({
  onEdit,
  onAssignRole,
  onActivate,
  onDeactivate,
  canUpdate = false,
  canAssignRole = false,
}: UserTableActionCallbacks): ColumnsType<User> {
  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: User) => {
        const fullName = [record.firstName, record.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        return (
          <span className="font-semibold text-dim-grey-900">
            {fullName || '—'}
          </span>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <span className="text-dim-grey-700">{email}</span>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phoneNumber: string | null) =>
        phoneNumber && phoneNumber.trim().length > 0 ? (
          <span className="text-dim-grey-700">{phoneNumber.trim()}</span>
        ) : (
          <span className="text-dim-grey-400">—</span>
        ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, record: User) =>
        record.role?.name ? (
          <Tag color="blue" className="font-medium capitalize">
            {record.role.name}
          </Tag>
        ) : (
          <span className="italic text-dim-grey-400">No role</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} className="font-medium">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(createdAt)}
        </span>
      ),
    },
  ];

  if (canUpdate || canAssignRole) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
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
          {canAssignRole && (
            <Button
              type="text"
              className="flex! items-center gap-1 text-xs!"
              onClick={() => onAssignRole(record)}
            >
              <SafetyCertificateOutlined /> Assign Role
            </Button>
          )}
          {canUpdate &&
            (record.isActive ? (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs!"
                onClick={() => onDeactivate(record)}
              >
                <StopOutlined /> Deactivate
              </Button>
            ) : (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs!"
                onClick={() => onActivate(record)}
              >
                <CheckCircleOutlined /> Activate
              </Button>
            ))}
        </Space>
      ),
    });
  }

  return columns;
}
