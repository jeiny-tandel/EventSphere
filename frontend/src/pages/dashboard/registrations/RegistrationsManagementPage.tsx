import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Descriptions,
  Empty,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { RegistrationFilterBar } from "../../../components/registrations/RegistrationFilterBar.tsx";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import { useRegistrationFilters } from "../../../hooks/useRegistrationFilters.ts";
import {
  fetchManagementRegistrations,
  updateRegistrationStatusThunk,
} from "../../../store/slices/registrationSlice.ts";
import type {
  ManagementEventRegistration,
  RegistrationStatus,
} from "../../../types/registration.types.ts";
import {
  extractErrorMessage,
  formatDate,
  hasPermission,
  type RegistrationFilterState,
} from "../../../utils";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : inrFormatter.format(price);
}

const STATUS_CONFIG: Record<
  RegistrationStatus,
  { color: string; label: string }
> = {
  PENDING: { color: "gold", label: "Pending" },
  CONFIRMED: { color: "green", label: "Confirmed" },
  CANCELLED: { color: "default", label: "Cancelled" },
};

function getAttendeeName(record: ManagementEventRegistration): string {
  const fullName = [record.user?.firstName, record.user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || record.user?.email || "Unknown Attendee";
}

export function RegistrationsManagementPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    managementRegistrations,
    managementLoading,
    isManagementLoaded,
    isUpdatingStatus,
    error,
  } = useAppSelector((state) => state.registration);

  const canUpdate = hasPermission(user, "registrations.update");

  const [selectedRegistration, setSelectedRegistration] =
    useState<ManagementEventRegistration | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    if (!isManagementLoaded) {
      dispatch(fetchManagementRegistrations());
    }
  }, [dispatch, isManagementLoaded]);

  const {
    filters,
    filteredRegistrations,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  } = useRegistrationFilters(managementRegistrations);

  const handleFilterChange = <K extends keyof RegistrationFilterState>(
    key: K,
    value: RegistrationFilterState[K],
  ) => {
    updateFilter(key, value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    resetFilters();
    setCurrentPage(1);
  };

  const handleStatusChange = (
    record: ManagementEventRegistration,
    targetStatus: "CONFIRMED" | "CANCELLED",
  ) => {
    if (updatingId !== null || isUpdatingStatus) return;

    const attendeeName = getAttendeeName(record);
    const eventTitle = record.event?.title || "this event";
    const isConfirm = targetStatus === "CONFIRMED";

    Modal.confirm({
      title: isConfirm ? "Confirm Registration" : "Cancel Registration",
      icon: <ExclamationCircleOutlined />,
      content: isConfirm
        ? `Confirm ${attendeeName}'s registration (${record.quantity ?? 1} ticket${(record.quantity ?? 1) === 1 ? "" : "s"}) for "${eventTitle}"?`
        : `Cancel ${attendeeName}'s registration for "${eventTitle}"? This will release the booked seats back to the event.`,
      okText: isConfirm ? "Confirm" : "Yes, Cancel",
      okType: isConfirm ? "primary" : "danger",
      cancelText: "Close",
      centered: true,
      async onOk() {
        try {
          setUpdatingId(record.id);
          const updated = await dispatch(
            updateRegistrationStatusThunk({
              id: record.id,
              status: targetStatus,
            }),
          ).unwrap();
          if (selectedRegistration?.id === updated.id) {
            setSelectedRegistration(updated);
          }
          message.success(
            isConfirm
              ? `Registration for "${eventTitle}" confirmed.`
              : `Registration for "${eventTitle}" cancelled.`,
          );
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            `Failed to ${isConfirm ? "confirm" : "cancel"} registration. Please try again.`,
          );
          message.error(errorMessage);
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const columns: ColumnsType<ManagementEventRegistration> = [
    {
      title: "Attendee",
      key: "attendee",
      width: 220,
      ellipsis: { showTitle: false },
      render: (_: unknown, record) => {
        const name = getAttendeeName(record);
        const email = record.user?.email || "—";
        return (
          <Tooltip title={`${name} (${email})`}>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-semibold text-dim-grey-900">{name}</p>
              <p className="mt-0.5 truncate text-xs text-dim-grey-500">
                {email}
              </p>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Event",
      key: "event",
      width: 230,
      ellipsis: { showTitle: false },
      render: (_: unknown, record) => (
        <Tooltip title={record.event?.title || "—"}>
          <Link
            to={`/events/${record.eventId}`}
            className="block truncate font-medium text-dim-grey-800 hover:text-peach-fuzz-500 transition-colors"
          >
            {record.event?.title || "—"}
          </Link>
        </Tooltip>
      ),
    },
    {
      title: "Booking Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (createdAt: string) => (
        <span className="text-xs text-dim-grey-600 whitespace-nowrap">
          {formatDate(createdAt)}
        </span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      align: "right",
      render: (quantity?: number) => (
        <span className="font-semibold tabular-nums text-dim-grey-800">
          {quantity ?? 1}
        </span>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      width: 125,
      align: "right",
      render: (_: unknown, record) => {
        const unitPrice = Number(record.event?.price ?? 0);
        const qty = record.quantity ?? 1;
        return (
          <span className="font-semibold tabular-nums text-dim-grey-900 whitespace-nowrap">
            {formatPrice(unitPrice * qty)}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 115,
      render: (status: RegistrationStatus) => {
        const config = STATUS_CONFIG[status] ?? {
          color: "default",
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
      title: "Actions",
      key: "actions",
      width: canUpdate ? 220 : 100,
      render: (_: unknown, record) => {
        const isRowUpdating = updatingId === record.id;
        const disableActions = updatingId !== null || isUpdatingStatus;

        return (
          <Space size="small">
            <Button
              type="text"
              className="flex! items-center gap-1 text-xs! px-2!"
              onClick={() => setSelectedRegistration(record)}
            >
              <EyeOutlined /> View
            </Button>

            {canUpdate && record.status === "PENDING" && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs! text-emerald-600! hover:text-emerald-700! px-2!"
                loading={isRowUpdating}
                disabled={disableActions}
                onClick={() => handleStatusChange(record, "CONFIRMED")}
              >
                <CheckOutlined /> Confirm
              </Button>
            )}

            {canUpdate &&
              (record.status === "PENDING" ||
                record.status === "CONFIRMED") && (
                <Button
                  type="text"
                  className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700! px-2!"
                  loading={isRowUpdating}
                  disabled={disableActions}
                  onClick={() => handleStatusChange(record, "CANCELLED")}
                >
                  <CloseOutlined /> Cancel
                </Button>
              )}
          </Space>
        );
      },
    },
  ];

  const selectedUnitPrice = Number(selectedRegistration?.event?.price ?? 0);
  const selectedQty = selectedRegistration?.quantity ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registration Management"
        description="View attendee bookings, filter registrations, and manage registration statuses."
        actions={
          <Button
            type="default"
            className="flex! items-center gap-1.5 text-xs!"
            loading={managementLoading}
            onClick={() => dispatch(fetchManagementRegistrations())}
          >
            <ReloadOutlined />
            Refresh
          </Button>
        }
      />

      {error && !managementLoading && (
        <Alert
          type="error"
          message="Failed to load registrations"
          description={error}
          showIcon
          action={
            <Button
              className="text-xs!"
              onClick={() => dispatch(fetchManagementRegistrations())}
            >
              Retry
            </Button>
          }
        />
      )}

      <RegistrationFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        searchPlaceholder="Search by attendee or event title..."
      />

      <Card
        className="overflow-hidden rounded-xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-0"
      >
        <Table<ManagementEventRegistration>
          rowKey="id"
          columns={columns}
          dataSource={filteredRegistrations}
          loading={managementLoading}
          scroll={{ x: 960 }}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            responsive: true,
            onChange: (page, nextPageSize) => {
              setCurrentPage(page);
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
            showTotal: (total) =>
              `Total ${total} registration${total === 1 ? "" : "s"}`,
          }}
          locale={{
            emptyText:
              managementRegistrations.length > 0 && hasActiveFilters ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="space-y-2 py-4">
                      <span className="block text-sm text-dim-grey-500">
                        No registrations match your current filters.
                      </span>
                      <Button
                        type="default"
                        className="text-xs!"
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  }
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-sm text-dim-grey-500">
                      No event registrations found.
                    </span>
                  }
                />
              ),
          }}
        />
      </Card>

      {/* Registration Details Modal */}
      <Modal
        title={
          <div className="text-lg font-bold text-dim-grey-900">
            Registration Details
          </div>
        }
        open={Boolean(selectedRegistration)}
        onCancel={() => setSelectedRegistration(null)}
        centered
        width={580}
        footer={[
          <Button
            key="close"
            type="default"
            onClick={() => setSelectedRegistration(null)}
          >
            Close
          </Button>,
        ]}
      >
        {selectedRegistration && (
          <Descriptions
            bordered
            column={1}
            size="small"
            className="mt-3"
          >
            <Descriptions.Item label="Attendee Name">
              {getAttendeeName(selectedRegistration)}
            </Descriptions.Item>
            <Descriptions.Item label="Attendee Email">
              {selectedRegistration.user?.email || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Event Title">
              <Link
                to={`/events/${selectedRegistration.eventId}`}
                className="font-medium text-peach-fuzz-600 hover:text-peach-fuzz-700"
              >
                {selectedRegistration.event?.title || "—"}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="Event Category">
              {selectedRegistration.event?.category?.name ? (
                <Tag color="purple" className="mr-0 font-medium">
                  {selectedRegistration.event.category.name}
                </Tag>
              ) : (
                "Uncategorized"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Booking Date">
              {formatDate(selectedRegistration.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Ticket Quantity">
              {selectedQty}
            </Descriptions.Item>
            <Descriptions.Item label="Unit Ticket Price">
              {formatPrice(selectedUnitPrice)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Booking Amount">
              <span className="font-semibold text-dim-grey-900">
                {formatPrice(selectedUnitPrice * selectedQty)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Current Status">
              <Tag
                color={
                  STATUS_CONFIG[selectedRegistration.status]?.color ?? "default"
                }
                className="mr-0 font-medium"
              >
                {STATUS_CONFIG[selectedRegistration.status]?.label ??
                  selectedRegistration.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default RegistrationsManagementPage;
