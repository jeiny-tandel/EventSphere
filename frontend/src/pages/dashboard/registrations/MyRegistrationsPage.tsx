import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Empty, Modal, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Card, PageHeader } from '../../../components/common';
import { ROUTES } from '../../../constants/routes.ts';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux.ts';
import {
  cancelRegistrationThunk,
  fetchMyRegistrations,
} from '../../../store/slices/registrationSlice.ts';
import type {
  EventRegistration,
  RegistrationStatus,
} from '../../../types/registration.types.ts';
import { formatDate } from '../../../utils/date.utils.ts';
import { extractErrorMessage } from '../../../utils/error.utils.ts';

const STATUS_CONFIG: Record<
  RegistrationStatus,
  { color: string; label: string }
> = {
  PENDING: { color: 'gold', label: 'Pending' },
  CONFIRMED: { color: 'green', label: 'Confirmed' },
  CANCELLED: { color: 'default', label: 'Cancelled' },
};

export function MyRegistrationsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { registrations, loading, error } = useAppSelector(
    (state) => state.registration,
  );

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyRegistrations());
  }, [dispatch]);

  const handleCancelRegistration = (registration: EventRegistration) => {
    const eventTitle = registration.event?.title || 'this event';

    Modal.confirm({
      title: 'Cancel Registration',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to cancel your registration for "${eventTitle}"?`,
      okText: 'Yes, Cancel Registration',
      okType: 'danger',
      cancelText: 'Keep Registration',
      centered: true,
      async onOk() {
        try {
          setCancellingId(registration.id);
          await dispatch(cancelRegistrationThunk(registration.id)).unwrap();
          message.success(
            `Registration for "${eventTitle}" cancelled successfully.`,
          );
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            'Failed to cancel registration. Please try again.',
          );
          message.error(errorMessage);
        } finally {
          setCancellingId(null);
        }
      },
    });
  };

  const columns: ColumnsType<EventRegistration> = [
    {
      title: 'Event',
      key: 'event',
      render: (_: unknown, record: EventRegistration) => (
        <div className="max-w-xs sm:max-w-sm">
          <span className="font-semibold text-dim-grey-900 line-clamp-1">
            {record.event?.title || '—'}
          </span>
          {record.event?.description && (
            <p className="line-clamp-1 text-xs text-dim-grey-500">
              {record.event.description}
            </p>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (_: unknown, record: EventRegistration) =>
        record.event?.category?.name ? (
          <Tag color="purple" className="font-medium mr-0">
            {record.event.category.name}
          </Tag>
        ) : (
          <span className="italic text-dim-grey-400">Uncategorized</span>
        ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, record: EventRegistration) => (
        <span className="text-sm text-dim-grey-700">
          {record.event?.location || '—'}
        </span>
      ),
    },
    {
      title: 'Event Date',
      key: 'eventDate',
      render: (_: unknown, record: EventRegistration) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(record.event?.startDate)}
        </span>
      ),
    },
    {
      title: 'Registered On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(createdAt)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: RegistrationStatus) => {
        const config = STATUS_CONFIG[status] ?? {
          color: 'default',
          label: status,
        };
        return (
          <Tag color={config.color} className="font-medium mr-0">
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_: unknown, record: EventRegistration) => {
        if (record.status === 'PENDING' || record.status === 'CONFIRMED') {
          return (
            <Button
              type="text"
              className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700!"
              disabled={cancellingId !== null}
              loading={cancellingId === record.id}
              onClick={() => handleCancelRegistration(record)}
            >
              Cancel
            </Button>
          );
        }
        return <span className="text-xs italic text-dim-grey-400">—</span>;
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Registrations"
        description="View and manage your event registrations."
        actions={
          <Link to={ROUTES.EVENTS}>
            <Button type="default" className="text-xs!">
              Browse Events
            </Button>
          </Link>
        }
      />

      {/* Error Alert State */}
      {error && !loading && (
        <Alert
          type="error"
          message="Failed to load registrations"
          description={error}
          showIcon
          action={
            <Button
              className="text-xs!"
              onClick={() => dispatch(fetchMyRegistrations())}
            >
              Retry
            </Button>
          }
        />
      )}

      {/* Registrations Table Card */}
      <Card
        className="overflow-hidden rounded-2xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-0"
      >
        <Table<EventRegistration>
          rowKey="id"
          columns={columns}
          dataSource={registrations}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            responsive: true,
            showTotal: (total) =>
              `Total ${total} registration${total === 1 ? '' : 's'}`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-3 py-6">
                    <p className="text-sm text-dim-grey-500">
                      You haven't registered for any events yet.
                    </p>
                    <Link to={ROUTES.EVENTS}>
                      <Button type="primary" className="text-xs!">
                        Browse Events
                      </Button>
                    </Link>
                  </div>
                }
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}

export default MyRegistrationsPage;
