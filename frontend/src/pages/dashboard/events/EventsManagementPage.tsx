import { useEffect, useState, type ReactElement } from "react";
import { Alert, Empty, Modal, Space, Table, Tabs, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../../components/common";
import { EventFilterBar } from "../../../components/events/EventFilterBar.tsx";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux.ts";
import { useEventFilters } from "../../../hooks/useEventFilters.ts";
import {
  deleteEvent,
  deleteEventCategory,
  fetchEventCategories,
  fetchManagementEvents,
} from "../../../store/slices/eventSlice.ts";
import type {
  Event,
  EventCategory,
  EventStatus,
} from "../../../types/event.types.ts";
import { isAdminUser } from "../../../constants/roles.ts";
import {
  extractErrorMessage,
  formatDate,
  getEventCoverImageUrl,
  hasPermission,
} from "../../../utils";
import { CategoryFormModal, EventFormModal } from "./components";

const STATUS_CONFIG: Record<EventStatus, { color: string; label: string }> = {
  DRAFT: { color: "default", label: "Draft" },
  PUBLISHED: { color: "success", label: "Published" },
  CANCELLED: { color: "error", label: "Cancelled" },
  COMPLETED: { color: "blue", label: "Completed" },
};

export function EventsManagementPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    managementEvents,
    categories,
    isManagementLoading,
    isManagementLoaded,
    isCategoriesLoading,
    areCategoriesLoaded,
    isSubmitting,
    error,
  } = useAppSelector((state) => state.events);

  const canCreate = hasPermission(user, "events.create");
  const canUpdate = hasPermission(user, "events.update");
  const canDelete = hasPermission(user, "events.delete");
  const isAdmin = isAdminUser(user);

  const [activeTab, setActiveTab] = useState("events");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | null>(null);

  useEffect(() => {
    if (!isManagementLoaded) {
      dispatch(fetchManagementEvents());
    }
  }, [dispatch, isManagementLoaded]);

  useEffect(() => {
    if (!areCategoriesLoaded && !isCategoriesLoading) {
      dispatch(fetchEventCategories());
    }
  }, [areCategoriesLoaded, isCategoriesLoading, dispatch]);

  const {
    filters,
    filteredEvents,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  } = useEventFilters(managementEvents);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === "categories" && !areCategoriesLoaded && !isCategoriesLoading) {
      dispatch(fetchEventCategories());
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleOpenCreateCategoryModal = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: EventCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteEvent = (event: Event) => {
    Modal.confirm({
      title: "Delete Event",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the event "${event.title}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(deleteEvent(event.id)).unwrap();
          message.success(`Event "${event.title}" deleted successfully.`);
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to delete event. Please try again.",
          );
          message.error(errorMessage);
        }
      },
    });
  };

  const handleDeleteCategory = (category: EventCategory) => {
    Modal.confirm({
      title: "Delete Category",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(deleteEventCategory(category.id)).unwrap();
          message.success(`Category "${category.name}" deleted successfully.`);
        } catch (err) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to delete category. Please try again.",
          );
          const lower = errorMessage.toLowerCase();
          const isConflict =
            lower.includes("associated with") ||
            lower.includes("existing events") ||
            lower.includes("conflict") ||
            lower.includes("409");

          if (isConflict) {
            message.error(
              `Cannot delete category "${category.name}" because it is currently associated with existing events. Reassign or delete those events first.`,
            );
          } else {
            message.error(errorMessage);
          }
        }
      },
    });
  };

  const columns: ColumnsType<Event> = [
    {
      title: "Event Title",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: Event) => {
        const coverImageUrl = getEventCoverImageUrl(record.coverImage);

        return (
          <div className="flex items-center gap-3">
            <div className="aspect-video h-8 w-14 shrink-0 overflow-hidden rounded-md border border-dim-grey-200 bg-dim-grey-100">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-dim-grey-400">
                  <PictureOutlined className="text-sm" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-dim-grey-900">{title}</span>
              {record.description && (
                <p className="line-clamp-1 text-xs text-dim-grey-500">
                  {record.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Category",
      key: "category",
      render: (_: unknown, record: Event) =>
        record.category?.name ? (
          <Tag color="purple" className="font-medium">
            {record.category.name}
          </Tag>
        ) : (
          <span className="italic text-dim-grey-400">Uncategorized</span>
        ),
    },
    {
      title: "Organizer",
      key: "organizer",
      render: (_: unknown, record: Event) => {
        if (!record.organizer) {
          return <span className="italic text-dim-grey-400">—</span>;
        }
        const fullName = [record.organizer.firstName, record.organizer.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        return (
          <div>
            <span className="text-sm font-medium text-dim-grey-800">
              {fullName || "Organizer"}
            </span>
            {record.organizer.email && (
              <p className="text-xs text-dim-grey-500">
                {record.organizer.email}
              </p>
            )}
          </div>
        );
      },
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (location: string) => (
        <span className="text-sm text-dim-grey-700">{location || "—"}</span>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (startDate: string) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(startDate)}
        </span>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (endDate: string) => (
        <span className="text-xs text-dim-grey-600">{formatDate(endDate)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: EventStatus) => {
        const config = STATUS_CONFIG[status] ?? {
          color: "default",
          label: status,
        };
        return (
          <Tag color={config.color} className="font-medium">
            {config.label}
          </Tag>
        );
      },
    },
  ];

  if (canUpdate || canDelete) {
    columns.push({
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Event) => {
        const canManageThisEvent =
          isAdmin || (Boolean(user?.id) && record.organizerId === user?.id);
        const canEditThisEvent = canUpdate && canManageThisEvent;
        const canDeleteThisEvent = canDelete && canManageThisEvent;

        if (!canEditThisEvent && !canDeleteThisEvent) {
          return <span className="italic text-dim-grey-400">—</span>;
        }

        return (
          <Space size="middle">
            {canEditThisEvent && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs!"
                onClick={() => handleEditEvent(record)}
              >
                <EditOutlined /> Edit
              </Button>
            )}
            {canDeleteThisEvent && (
              <Button
                type="text"
                className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700!"
                disabled={isSubmitting}
                onClick={() => handleDeleteEvent(record)}
              >
                <DeleteOutlined /> Delete
              </Button>
            )}
          </Space>
        );
      },
    });
  }

  const categoryColumns: ColumnsType<EventCategory> = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-semibold text-dim-grey-900">{name}</span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: string | null) =>
        description && description.trim().length > 0 ? (
          <span className="text-dim-grey-700">{description}</span>
        ) : (
          <span className="italic text-dim-grey-400">No description</span>
        ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => (
        <span className="text-xs text-dim-grey-600">
          {formatDate(createdAt)}
        </span>
      ),
    },
  ];

  if (canUpdate || canDelete) {
    categoryColumns.push({
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: EventCategory) => (
        <Space size="middle">
          {canUpdate && (
            <Button
              type="text"
              className="flex! items-center gap-1 text-xs!"
              onClick={() => handleEditCategory(record)}
            >
              <EditOutlined /> Edit
            </Button>
          )}
          {canDelete && (
            <Button
              type="text"
              className="flex! items-center gap-1 text-xs! text-red-600! hover:text-red-700!"
              disabled={isSubmitting}
              onClick={() => handleDeleteCategory(record)}
            >
              <DeleteOutlined /> Delete
            </Button>
          )}
        </Space>
      ),
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Event Management"
        description="View and coordinate events, schedules, locations, and categories."
        actions={
          activeTab === "events" && canCreate ? (
            <Button
              type="primary"
              className="flex! items-center gap-1.5"
              onClick={handleOpenCreateModal}
            >
              <PlusOutlined />
              <span>Add Event</span>
            </Button>
          ) : undefined
        }
      />

      {/* Error Alert State */}
      {error && !isManagementLoading && !isCategoriesLoading && (
        <Alert
          type="error"
          message="An error occurred"
          description={error}
          showIcon
          action={
            <Button
              className="text-xs!"
              onClick={() => {
                if (activeTab === "categories") {
                  dispatch(fetchEventCategories());
                } else {
                  dispatch(fetchManagementEvents());
                }
              }}
            >
              Retry
            </Button>
          }
        />
      )}

      {/* Navigation Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "events",
            label: "Events",
            children: (
              <div className="space-y-4">
                <EventFilterBar
                  filters={filters}
                  categories={categories}
                  onFilterChange={updateFilter}
                  onReset={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                  showStatusFilter
                  loadingCategories={isCategoriesLoading}
                />

                <Card
                  className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
                  bodyClassName="!p-0"
                >
                  <Table<Event>
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredEvents}
                    loading={isManagementLoading}
                    scroll={{ x: 800 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      responsive: true,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div className="space-y-2">
                              <span className="block text-sm text-dim-grey-500">
                                {hasActiveFilters
                                  ? "No events match the selected filters."
                                  : "No events found."}
                              </span>
                              {hasActiveFilters && (
                                <Button
                                  type="default"
                                  className="text-xs!"
                                  onClick={resetFilters}
                                >
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                          }
                        />
                      ),
                    }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "categories",
            label: "Categories",
            children: (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-dim-grey-900">
                      Event Categories
                    </h3>
                    <p className="text-xs text-dim-grey-500">
                      Define and maintain categories used to organize and
                      classify events.
                    </p>
                  </div>
                  {canCreate && (
                    <Button
                      type="primary"
                      className="flex! items-center gap-1.5"
                      onClick={handleOpenCreateCategoryModal}
                    >
                      <PlusOutlined />
                      <span>Add Category</span>
                    </Button>
                  )}
                </div>

                <Card
                  className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
                  bodyClassName="!p-0"
                >
                  <Table<EventCategory>
                    rowKey="id"
                    columns={categoryColumns}
                    dataSource={categories}
                    loading={isCategoriesLoading}
                    scroll={{ x: 600 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      responsive: true,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-sm text-dim-grey-500">
                              No categories found.
                            </span>
                          }
                        />
                      ),
                    }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* Event Form Modal (Create / Edit) */}
      <EventFormModal
        open={isModalOpen}
        event={selectedEvent}
        onClose={handleCloseModal}
      />

      {/* Category Form Modal (Create / Edit) */}
      <CategoryFormModal
        open={isCategoryModalOpen}
        category={selectedCategory}
        onClose={handleCloseCategoryModal}
      />
    </div>
  );
}

export default EventsManagementPage;
