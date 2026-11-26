import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, InputNumber, Spin, Tag, message } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PictureOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card } from "../../components/common";
import { ROUTES } from "../../constants/routes.ts";
import { useAppDispatch, useAppSelector } from "../../hooks/redux.ts";
import { fetchEventById } from "../../store/slices/eventSlice.ts";
import {
  fetchMyRegistrations,
  registerForEventThunk,
} from "../../store/slices/registrationSlice.ts";
import type { EventStatus } from "../../types/event.types.ts";
import {
  extractErrorMessage,
  formatEventDateRange,
  formatTime,
  getEventCoverImageUrl,
  isMultiDayEvent,
} from "../../utils";

const STATUS_CONFIG: Record<EventStatus, { color: string; label: string }> = {
  DRAFT: { color: "default", label: "Draft" },
  PUBLISHED: { color: "success", label: "Published" },
  CANCELLED: { color: "error", label: "Cancelled" },
  COMPLETED: { color: "blue", label: "Completed" },
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : inrFormatter.format(price);
}

export function EventDetailsPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedEvent, events, isLoading, error } = useAppSelector(
    (state) => state.events,
  );
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { registrations } = useAppSelector((state) => state.registration);

  const [quantity, setQuantity] = useState<number>(1);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyRegistrations());
    }
  }, [dispatch, isAuthenticated]);

  const event = useMemo(() => {
    if (selectedEvent && selectedEvent.id === id) {
      return selectedEvent;
    }
    return events.find((item) => item.id === id) ?? null;
  }, [selectedEvent, events, id]);

  const activeRegistration = useMemo(() => {
    if (!isAuthenticated || !user || !event) return null;
    return (
      registrations.find(
        (reg) =>
          reg.eventId === event.id &&
          (!reg.userId || reg.userId === user.id) &&
          (reg.status === "PENDING" || reg.status === "CONFIRMED"),
      ) ?? null
    );
  }, [registrations, isAuthenticated, user, event]);

  const maxTicketsPerUser = event?.maxTicketsPerUser ?? 5;
  const remainingUserAllowance = activeRegistration
    ? Math.max(0, maxTicketsPerUser - (activeRegistration.quantity ?? 1))
    : maxTicketsPerUser;

  const maxAllowedQuantity = useMemo(() => {
    if (!event) return 1;
    if (event.remainingSeats !== null && event.remainingSeats !== undefined) {
      return Math.max(0, Math.min(event.remainingSeats, remainingUserAllowance));
    }
    return Math.max(0, remainingUserAllowance);
  }, [event, remainingUserAllowance]);

  const effectiveQuantity =
    maxAllowedQuantity > 0
      ? Math.min(Math.max(1, quantity), maxAllowedQuantity)
      : 1;

  const handleRegister = async () => {
    if (!event || isRegistering) return;

    if (!isAuthenticated) {
      message.info("Please log in to register for an event.");
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }

    if (event.isSoldOut || maxAllowedQuantity < 1) {
      return;
    }

    try {
      setIsRegistering(true);
      await dispatch(
        registerForEventThunk({
          eventId: event.id,
          quantity: effectiveQuantity,
        }),
      ).unwrap();
      message.success(
        `Successfully registered for "${event.title}" (${effectiveQuantity} ticket${effectiveQuantity === 1 ? "" : "s"})!`,
      );
      await Promise.all([
        dispatch(fetchEventById(event.id)),
        dispatch(fetchMyRegistrations()),
      ]);
      setQuantity(1);
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
      } else if (lower.includes("capacity") || lower.includes("remaining")) {
        message.error(errorMessage);
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading && !event) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 flex justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-6">
        <Link
          to={ROUTES.EVENTS}
          className="inline-flex items-center gap-2 text-sm font-medium text-dim-grey-600 hover:text-peach-fuzz-500"
        >
          <ArrowLeftOutlined />
          <span>Back to Events</span>
        </Link>
        <Alert
          type="error"
          message="Unable to load event details"
          description={error}
          showIcon
          action={
            id ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-700 underline hover:text-red-800"
                onClick={() => dispatch(fetchEventById(id))}
              >
                Retry
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-6">
        <Link
          to={ROUTES.EVENTS}
          className="inline-flex items-center gap-2 text-sm font-medium text-dim-grey-600 hover:text-peach-fuzz-500"
        >
          <ArrowLeftOutlined />
          <span>Back to Events</span>
        </Link>
        <Alert
          type="warning"
          message="Event not found"
          description="The requested event could not be found or is no longer available."
          showIcon
        />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[event.status];
  const coverImageUrl = getEventCoverImageUrl(event.coverImage);
  const organizerName = event.organizer
    ? [event.organizer.firstName, event.organizer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
    : null;
  const price = Number(event.price ?? 0);
  const totalBookingCost = price * effectiveQuantity;
  const registeredCount = event.registeredCount ?? 0;
  const isUnlimited =
    event.capacity === null || event.capacity === undefined;
  const isPublished = event.status === "PUBLISHED";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 space-y-8">
      <div>
        <Link
          to={ROUTES.EVENTS}
          className="inline-flex items-center gap-2 text-sm font-medium text-dim-grey-600 transition-colors hover:text-peach-fuzz-500"
        >
          <ArrowLeftOutlined />
          <span>Back to Events</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Event Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-dim-grey-200 bg-dim-grey-100 aspect-video shadow-xs">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-dim-grey-400">
                <PictureOutlined className="text-5xl" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {event.category?.name ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-peach-fuzz-100 px-3 py-1 text-xs font-semibold text-peach-fuzz-700">
                  <TagOutlined />
                  {event.category.name}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-dim-grey-100 px-3 py-1 text-xs font-medium text-dim-grey-600">
                  Uncategorized
                </span>
              )}
              {statusConfig && (
                <Tag color={statusConfig.color} className="font-medium mr-0">
                  {statusConfig.label}
                </Tag>
              )}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-dim-grey-900 sm:text-3xl">
              {event.title}
            </h1>

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-dim-grey-200 bg-white p-4 text-sm text-dim-grey-700 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <CalendarOutlined className="mt-0.5 text-base text-peach-fuzz-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-dim-grey-400">
                    Date & Time
                  </p>
                  <p className="mt-0.5 font-medium text-dim-grey-800">
                    {formatEventDateRange(event.startDate, event.endDate)}
                  </p>
                  {isMultiDayEvent(event.startDate, event.endDate) && (
                    <p className="mt-0.5 text-xs text-dim-grey-500">
                      Starts {formatTime(event.startDate)} · Ends{" "}
                      {formatTime(event.endDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <EnvironmentOutlined className="mt-0.5 text-base text-peach-fuzz-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-dim-grey-400">
                    Venue / Location
                  </p>
                  <p className="mt-0.5 font-medium text-dim-grey-800">
                    {event.location || "Location TBA"}
                  </p>
                </div>
              </div>

              {organizerName && (
                <div className="flex items-start gap-2.5 sm:col-span-2 pt-2 border-t border-dim-grey-100">
                  <UserOutlined className="mt-0.5 text-base text-peach-fuzz-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-dim-grey-400">
                      Organiser
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-medium text-dim-grey-800">
                        {organizerName}
                      </span>
                      {event.organizer?.email && (
                        <span className="inline-flex items-center gap-1 text-xs text-dim-grey-500">
                          <MailOutlined />
                          {event.organizer.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Card className="rounded-xl border border-dim-grey-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-dim-grey-900">
                About This Event
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-dim-grey-700">
                {event.description}
              </p>
            </Card>
          </div>
        </div>

        {/* Ticket Booking & Availability Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 rounded-2xl border border-dim-grey-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-baseline justify-between border-b border-dim-grey-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-dim-grey-400">
                  Ticket Price
                </p>
                <p className="mt-1 text-2xl font-extrabold text-dim-grey-900">
                  {formatPrice(price)}
                </p>
              </div>
              {price > 0 && (
                <span className="text-xs text-dim-grey-500">per ticket</span>
              )}
            </div>

            {/* Availability Summary */}
            <div className="space-y-2 rounded-xl bg-dim-grey-50 p-4 text-xs text-dim-grey-700">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-medium text-dim-grey-600">
                  <TeamOutlined className="text-peach-fuzz-500" />
                  Availability
                </span>
                {event.isSoldOut ? (
                  <Tag color="error" className="mr-0 font-semibold">
                    Sold Out
                  </Tag>
                ) : isUnlimited ? (
                  <Tag color="success" className="mr-0 font-medium">
                    Open Attendance
                  </Tag>
                ) : (
                  <span className="font-semibold text-dim-grey-900">
                    {event.remainingSeats} seats left
                  </span>
                )}
              </div>

              {!isUnlimited && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dim-grey-200/70 text-center">
                  <div>
                    <p className="text-[11px] text-dim-grey-400">Capacity</p>
                    <p className="font-semibold text-dim-grey-800">
                      {event.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-dim-grey-400">Booked</p>
                    <p className="font-semibold text-dim-grey-800">
                      {registeredCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-dim-grey-400">Remaining</p>
                    <p className="font-semibold text-dim-grey-800">
                      {event.remainingSeats}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-dim-grey-200/70 flex items-center justify-between text-[11px] text-dim-grey-500">
                <span>Max per user</span>
                <span className="font-semibold text-dim-grey-700">
                  {maxTicketsPerUser} ticket{maxTicketsPerUser === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Registration Action Area */}
            {activeRegistration ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                    <CheckCircleOutlined className="text-emerald-600" />
                    Registered
                  </span>
                  <Tag
                    color={
                      activeRegistration.status === "CONFIRMED"
                        ? "green"
                        : "gold"
                    }
                    className="mr-0 font-medium"
                  >
                    {activeRegistration.status === "CONFIRMED"
                      ? "Confirmed"
                      : "Pending"}
                  </Tag>
                </div>
                <p className="text-xs text-dim-grey-700">
                  You have booked{" "}
                  <span className="font-semibold">
                    {activeRegistration.quantity ?? 1} ticket
                    {(activeRegistration.quantity ?? 1) === 1 ? "" : "s"}
                  </span>{" "}
                  ({formatPrice((activeRegistration.quantity ?? 1) * price)}).
                </p>
                {remainingUserAllowance === 0 && (
                  <p className="text-[11px] text-dim-grey-500">
                    You have reached the maximum ticket limit for this event.
                  </p>
                )}
                <Link to={ROUTES.MY_REGISTRATIONS} className="block pt-1">
                  <Button type="default" block className="text-xs!">
                    Manage My Registrations
                  </Button>
                </Link>
              </div>
            ) : !isPublished ? (
              <Alert
                type="info"
                message="Registration unavailable"
                description={`This event is currently ${event.status.toLowerCase()} and not accepting registrations.`}
                showIcon
              />
            ) : event.isSoldOut || maxAllowedQuantity < 1 ? (
              <div className="space-y-3">
                <Button
                  type="primary"
                  block
                  disabled
                  className="bg-dim-grey-200! text-dim-grey-500! border-dim-grey-200! cursor-not-allowed!"
                >
                  {event.isSoldOut ? "Sold Out" : "Ticket Limit Reached"}
                </Button>
                <p className="text-center text-xs text-dim-grey-500">
                  {event.isSoldOut
                    ? "All seats for this event have been booked."
                    : "You have reached your ticket allowance for this event."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="ticket-quantity"
                    className="text-sm font-medium text-dim-grey-800"
                  >
                    Ticket Quantity
                  </label>
                  <InputNumber
                    id="ticket-quantity"
                    min={1}
                    max={maxAllowedQuantity}
                    precision={0}
                    value={effectiveQuantity}
                    onChange={(val) => {
                      if (typeof val === "number" && !isNaN(val)) {
                        setQuantity(
                          Math.min(Math.max(1, Math.floor(val)), maxAllowedQuantity),
                        );
                      }
                    }}
                    disabled={isRegistering}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center justify-between text-sm border-t border-dim-grey-100 pt-3">
                  <span className="font-medium text-dim-grey-600">Total</span>
                  <span className="text-base font-bold text-dim-grey-900">
                    {formatPrice(totalBookingCost)}
                  </span>
                </div>

                <Button
                  type="primary"
                  block
                  className="h-10! text-sm! font-semibold!"
                  loading={isRegistering}
                  onClick={handleRegister}
                >
                  {isAuthenticated
                    ? `Register (${effectiveQuantity} Ticket${effectiveQuantity === 1 ? "" : "s"})`
                    : "Log in to Register"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsPage;
