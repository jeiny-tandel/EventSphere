import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Empty, Spin, Tag, message } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Card } from "../../components/common";
import { EventFilterBar } from "../../components/events/EventFilterBar.tsx";
import { ROUTES } from "../../constants/routes.ts";
import { useAppDispatch, useAppSelector } from "../../hooks/redux.ts";
import { useEventFilters } from "../../hooks/useEventFilters.ts";
import {
  fetchEventCategories,
  fetchEvents,
} from "../../store/slices/eventSlice.ts";
import {
  fetchMyRegistrations,
  registerForEventThunk,
} from "../../store/slices/registrationSlice.ts";
import type { Event, EventStatus } from "../../types/event.types.ts";
import type { RegistrationStatus } from "../../types/registration.types.ts";
import {
  extractErrorMessage,
  formatEventDateRange,
  getEventCoverImageUrl,
} from "../../utils";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : inrFormatter.format(price);
}

const STATUS_CONFIG: Record<EventStatus, { color: string; label: string }> = {
  DRAFT: { color: "default", label: "Draft" },
  PUBLISHED: { color: "success", label: "Published" },
  CANCELLED: { color: "error", label: "Cancelled" },
  COMPLETED: { color: "blue", label: "Completed" },
};

export function EventsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    events,
    categories,
    isLoading,
    isCategoriesLoading,
    areCategoriesLoaded,
    error,
  } = useAppSelector((state) => state.events);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { registrations } = useAppSelector((state) => state.registration);

  const [registeringEventId, setRegisteringEventId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    if (!areCategoriesLoaded && !isCategoriesLoading) {
      dispatch(fetchEventCategories());
    }
  }, [dispatch, areCategoriesLoaded, isCategoriesLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyRegistrations());
    }
  }, [dispatch, isAuthenticated]);

  const publishedEvents = useMemo(
    () => events.filter((event) => event.status === "PUBLISHED"),
    [events],
  );

  const {
    filters,
    filteredEvents,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  } = useEventFilters(publishedEvents);

  const userRegistrationStatusMap = useMemo(() => {
    const map = new Map<string, RegistrationStatus>();
    if (!isAuthenticated || !user) return map;

    for (const reg of registrations) {
      if (reg.userId && reg.userId !== user.id) continue;

      const existingStatus = map.get(reg.eventId);
      if (reg.status === "CONFIRMED" || reg.status === "PENDING") {
        map.set(reg.eventId, reg.status);
      } else if (!existingStatus) {
        map.set(reg.eventId, reg.status);
      }
    }
    return map;
  }, [registrations, isAuthenticated, user]);

  const handleRegister = async (event: Event) => {
    if (registeringEventId) return;

    if (!isAuthenticated) {
      message.info("Please log in to register for an event.");
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }

    try {
      setRegisteringEventId(event.id);
      await dispatch(
        registerForEventThunk({ eventId: event.id, quantity: 1 }),
      ).unwrap();
      message.success(`Successfully registered for "${event.title}"!`);
      dispatch(fetchEvents());
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to register for the event. Please try again.",
      );
      const lower = errorMessage.toLowerCase();
      if (lower.includes("already have an active registration")) {
        message.warning(
          "You already have an active registration for this event.",
        );
      } else if (lower.includes("capacity")) {
        message.error(
          "This event has reached maximum capacity. No seats are currently available.",
        );
      } else {
        message.error(errorMessage);
      }
    } finally {
      setRegisteringEventId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-sm font-bold tracking-wider text-peach-fuzz-500 uppercase">
          Explore Events
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-dim-grey-900 sm:text-4xl">
          Upcoming Events & Workshops
        </h1>
        <p className="mt-3 max-w-2xl text-base text-dim-grey-600 sm:mx-auto">
          Discover learning opportunities, meetups, and conferences hosted on
          EventSphere.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-16 flex justify-center py-16">
          <Spin size="large" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mt-8 mx-auto max-w-2xl">
          <Alert
            type="error"
            message="Unable to load events"
            description={error}
            showIcon
            action={
              <button
                type="button"
                className="text-xs font-semibold text-red-700 underline hover:text-red-800"
                onClick={() => dispatch(fetchEvents())}
              >
                Retry
              </button>
            }
          />
        </div>
      )}

      {/* Filter & Sort Bar */}
      {!isLoading && !error && publishedEvents.length > 0 && (
        <div className="mt-10">
          <EventFilterBar
            filters={filters}
            categories={categories}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            showStatusFilter={false}
            loadingCategories={isCategoriesLoading}
          />
        </div>
      )}

      {/* Empty State (No Published Events) */}
      {!isLoading && !error && publishedEvents.length === 0 && (
        <div className="mt-12 flex justify-center py-16">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-sm text-dim-grey-500">
                No events currently available. Please check back later.
              </span>
            }
          />
        </div>
      )}

      {/* Empty State (No Matching Filters) */}
      {!isLoading &&
        !error &&
        publishedEvents.length > 0 &&
        filteredEvents.length === 0 && (
          <div className="mt-12 flex justify-center py-16">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="space-y-3">
                  <span className="block text-sm text-dim-grey-500">
                    No events match your current filters.
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
          </div>
        )}

      {/* Events Grid (Success State) */}
      {!isLoading && !error && filteredEvents.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const statusConfig = STATUS_CONFIG[event.status];
            const regStatus = userRegistrationStatusMap.get(event.id);
            const isRegistered =
              regStatus === "PENDING" || regStatus === "CONFIRMED";
            const coverImageUrl = getEventCoverImageUrl(event.coverImage);
            const price = Number(event.price ?? 0);
            const isUnlimited =
              event.capacity === null || event.capacity === undefined;
            const detailPath = `/events/${event.id}`;

            return (
              <Card
                key={event.id}
                className="flex flex-col justify-between rounded-xl border border-dim-grey-200 bg-white shadow-xs transition-shadow hover:shadow-md overflow-hidden"
                bodyClassName="!p-0 flex flex-col h-full"
              >
                <Link
                  to={detailPath}
                  className="block aspect-video w-full overflow-hidden bg-dim-grey-100"
                >
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-dim-grey-400">
                      <PictureOutlined className="text-3xl" />
                    </div>
                  )}
                </Link>

                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      {event.category?.name ? (
                        <span className="inline-block rounded-full bg-peach-fuzz-100 px-3 py-1 text-xs font-semibold text-peach-fuzz-700">
                          {event.category.name}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-dim-grey-100 px-3 py-1 text-xs font-medium text-dim-grey-600">
                          Uncategorized
                        </span>
                      )}
                      {statusConfig && (
                        <Tag
                          color={statusConfig.color}
                          className="font-medium mr-0"
                        >
                          {statusConfig.label}
                        </Tag>
                      )}
                    </div>

                    <Link to={detailPath} className="block">
                      <h2 className="mt-3 text-lg font-bold text-dim-grey-900 line-clamp-1 hover:text-peach-fuzz-500 transition-colors">
                        {event.title}
                      </h2>
                    </Link>

                    <div className="mt-2.5 space-y-1.5 text-xs text-dim-grey-500">
                      <p className="flex items-center gap-1.5">
                        <CalendarOutlined className="text-peach-fuzz-500" />
                        <span>
                          {formatEventDateRange(event.startDate, event.endDate)}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <EnvironmentOutlined className="text-peach-fuzz-500" />
                        <span className="truncate">
                          {event.location || "Location TBA"}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-bold text-sm text-dim-grey-900">
                        {formatPrice(price)}
                      </span>
                      <span className="text-dim-grey-500">
                        {event.isSoldOut ? (
                          <Tag color="error" className="mr-0 font-medium">
                            Sold Out
                          </Tag>
                        ) : isUnlimited ? (
                          "Open attendance"
                        ) : (
                          `${event.remainingSeats ?? event.capacity} seats left`
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-dim-grey-100 flex items-center justify-between gap-2">
                    <Link to={detailPath}>
                      <Button type="default" className="text-xs!">
                        View Details
                      </Button>
                    </Link>
                    {isRegistered ? (
                      <Button
                        type="default"
                        disabled
                        className="flex! items-center gap-1.5 text-xs! font-medium bg-dim-grey-100! text-dim-grey-500! border-dim-grey-200! cursor-not-allowed!"
                      >
                        <CheckCircleOutlined className="text-emerald-500 text-sm" />
                        <span>Registered</span>
                      </Button>
                    ) : event.isSoldOut ? (
                      <Button
                        type="primary"
                        disabled
                        className="flex! items-center text-xs! bg-dim-grey-200! text-dim-grey-500! border-dim-grey-200! cursor-not-allowed!"
                      >
                        Sold Out
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        className="flex! items-center text-xs!"
                        loading={registeringEventId === event.id}
                        disabled={registeringEventId !== null}
                        onClick={() => handleRegister(event)}
                      >
                        Register
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EventsPage;
