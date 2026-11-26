import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Alert, Empty, Modal, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { RegistrationFilterBar } from "../../../components/registrations/RegistrationFilterBar.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import { useRegistrationFilters } from "../../../hooks/useRegistrationFilters.ts";
import type { RegistrationFilterState } from "../../../utils";
import {
  cancelRegistrationThunk,
  fetchMyRegistrations,
} from "../../../store/slices/registrationSlice.ts";
import type {
  EventRegistration,
  RegistrationStatus,
} from "../../../types/registration.types.ts";
import { extractErrorMessage, formatDate } from "../../../utils";

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

export function MyRegistrationsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { registrations, loading, error } = useAppSelector(
    (state) => state.registration,
  );

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const {
    filters,
    filteredRegistrations,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  } = useRegistrationFilters(registrations);

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

  useEffect(() => {
    dispatch(fetchMyRegistrations());
  }, [dispatch]);

  const handleCancelRegistration = (registration: EventRegistration) => {
    const eventTitle = registration.event?.title || "this event";

    Modal.confirm({
      title: "Cancel Registration",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to cancel your registration for "${eventTitle}"?`,
      okText: "Yes, Cancel Registration",
      okType: "danger",
      cancelText: "Keep Registration",
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
            "Failed to cancel registration. Please try again.",
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
      title: "Event",
      key: "event",
      render: (_: unknown, record: EventRegistration) => (
        <div className="max-w-xs sm:max-w-sm">
          <Link
            to={`/events/${record.eventId}`}
            className="font-semibold text-dim-grey-900 hover:text-peach-fuzz-500 transition-colors line-clamp-1"
          >
            {record.event?.title || "—"}
          </Link>
        </div>
      ),
    },
    {
      title: "Registered On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(createdAt)}
        </span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (quantity?: number) => (
        <span className="font-medium text-dim-grey-800">{quantity ?? 1}</span>
      ),
    },
    {
      title: "Price / Ticket",
      key: "unitPrice",
      render: (_: unknown, record: EventRegistration) => {
        const unitPrice = Number(record.event?.price ?? 0);
        return (
          <span className="text-sm text-dim-grey-700">
            {formatPrice(unitPrice)}
          </span>
        );
      },
    },
    {
      title: "Total Price",
      key: "totalPrice",
      render: (_: unknown, record: EventRegistration) => {
        const unitPrice = Number(record.event?.price ?? 0);
        const qty = record.quantity ?? 1;
        return (
          <span className="font-semibold text-dim-grey-900">
            {formatPrice(unitPrice * qty)}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
      title: "Action",
      key: "action",
      align: "center",
      render: (_: unknown, record: EventRegistration) => {
        if (record.status === "PENDING" || record.status === "CONFIRMED") {
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

      {/* Filter & Sort Bar */}
      <RegistrationFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Registrations Table Card */}
      <Card
        className="overflow-hidden rounded-2xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-0"
      >
        <Table<EventRegistration>
          rowKey="id"
          columns={columns}
          dataSource={filteredRegistrations}
          loading={loading}
          scroll={{ x: 800 }}
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
              registrations.length > 0 && hasActiveFilters ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="space-y-3 py-6">
                      <p className="text-sm text-dim-grey-500">
                        No registrations match your current filters.
                      </p>
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
