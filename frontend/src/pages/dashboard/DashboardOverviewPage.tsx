import { useEffect, useMemo, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Area, Bar, Pie } from "@ant-design/charts";
import { Alert, Empty, Skeleton, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  PieChartOutlined,
  ReloadOutlined,
  RiseOutlined,
  TagOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Button, Card } from "../../components/common";
import { ROUTES } from "../../constants/routes.ts";
import { useAppDispatch, useAppSelector } from "../../hooks/redux.ts";
import { fetchDashboardOverview } from "../../store/slices/dashboardSlice.ts";
import type {
  DashboardRecentRegistration,
  DashboardUpcomingEvent,
} from "../../types/dashboard.types.ts";
import type { RegistrationStatus } from "../../types/registration.types.ts";
import { formatDate, formatEventDateRange } from "../../utils";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

function formatBookingTotal(amount: number): string {
  return amount <= 0 ? "Free" : inrFormatter.format(amount);
}

const STATUS_TAG_CONFIG: Record<
  RegistrationStatus,
  { color: string; label: string }
> = {
  CONFIRMED: { color: "green", label: "Confirmed" },
  PENDING: { color: "gold", label: "Pending" },
  CANCELLED: { color: "default", label: "Cancelled" },
};

const SCOPE_LABELS = {
  global: "Platform Overview",
  organizer: "Organiser Analytics",
  restricted: "Dashboard Overview",
} as const;

export function DashboardOverviewPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { overview, isLoading, error } = useAppSelector(
    (state) => state.dashboard,
  );

  useEffect(() => {
    dispatch(fetchDashboardOverview());
  }, [dispatch]);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "User";
  const todayFormatted = dayjs().format("dddd, MMM D, YYYY");

  const metrics = overview?.metrics;
  const charts = overview?.charts;
  const tables = overview?.tables;

  const registrationTrends = charts?.registrationTrends;

  const trendChartData = useMemo(() => {
    if (!registrationTrends?.length) return [];
    return registrationTrends.flatMap((point) => {
      const label = dayjs(point.date).format("MMM D");
      return [
        { date: label, series: "Tickets Booked", value: point.tickets },
        { date: label, series: "Registrations", value: point.registrations },
      ];
    });
  }, [registrationTrends]);

  const totalCategoryEvents = useMemo(
    () =>
      charts?.eventsByCategory.reduce((sum, item) => sum + item.count, 0) ?? 0,
    [charts?.eventsByCategory],
  );

  const categoryChartData = useMemo(
    () =>
      (charts?.eventsByCategory ?? []).map((item) => ({
        type: item.categoryName,
        value: item.count,
      })),
    [charts?.eventsByCategory],
  );

  const totalStatusRecords = useMemo(
    () =>
      charts?.registrationsByStatus.reduce(
        (sum, item) => sum + item.count,
        0,
      ) ?? 0,
    [charts?.registrationsByStatus],
  );

  const statusChartData = useMemo(
    () =>
      (charts?.registrationsByStatus ?? [])
        .filter((item) => item.count > 0)
        .map((item) => ({
          type: STATUS_TAG_CONFIG[item.status]?.label ?? item.status,
          value: item.count,
          tickets: item.tickets,
        })),
    [charts?.registrationsByStatus],
  );

  const popularChartData = useMemo(
    () =>
      (charts?.popularEvents ?? []).map((event) => ({
        title:
          event.title.length > 24
            ? `${event.title.slice(0, 22)}…`
            : event.title,
        fullTitle: event.title,
        ticketsBooked: event.ticketsBooked,
        estimatedBookingValue: event.estimatedBookingValue,
      })),
    [charts?.popularEvents],
  );

  if (isLoading && !overview) {
    return (
      <div className="space-y-6">
        <Card
          className="rounded-2xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6"
        >
          <Skeleton active paragraph={{ rows: 1 }} />
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card
              key={item}
              className="rounded-xl border border-dim-grey-200 bg-white"
              bodyClassName="!p-5"
            >
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card
            className="lg:col-span-8 rounded-xl border border-dim-grey-200 bg-white"
            bodyClassName="!p-6"
          >
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
          <Card
            className="lg:col-span-4 rounded-xl border border-dim-grey-200 bg-white"
            bodyClassName="!p-6"
          >
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <Alert
        type="error"
        message="Unable to load dashboard analytics"
        description={error}
        showIcon
        action={
          <Button
            type="primary"
            className="text-xs!"
            onClick={() => dispatch(fetchDashboardOverview())}
          >
            Retry
          </Button>
        }
      />
    );
  }

  const showUsersCard = Boolean(
    overview?.permissions.canViewUsers &&
      metrics?.totalUsers !== null &&
      metrics?.totalUsers !== undefined,
  );

  const statCards = [
    ...(showUsersCard
      ? [
          {
            key: "users",
            label: "Total Users",
            value: metrics?.totalUsers ?? 0,
            subtitle: "Registered platform accounts",
            icon: <TeamOutlined className="text-lg text-blue-600" />,
            iconBg: "bg-blue-50",
          },
        ]
      : []),
    {
      key: "total-events",
      label: "Total Events",
      value: metrics?.totalEvents ?? 0,
      subtitle:
        overview?.scope === "organizer"
          ? "Events owned by you"
          : "All scheduled & draft events",
      icon: <CalendarOutlined className="text-lg text-peach-fuzz-600" />,
      iconBg: "bg-peach-fuzz-50",
    },
    {
      key: "published-events",
      label: "Published Events",
      value: metrics?.publishedEvents ?? 0,
      subtitle:
        metrics && metrics.totalEvents > 0
          ? `${Math.round((metrics.publishedEvents / metrics.totalEvents) * 100)}% live in catalog`
          : "Live on public catalog",
      icon: <CheckCircleOutlined className="text-lg text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      key: "tickets-booked",
      label: "Total Tickets Booked",
      value: metrics?.totalTicketsBooked ?? 0,
      subtitle: `${metrics?.totalActiveRegistrations ?? 0} active registration${(metrics?.totalActiveRegistrations ?? 0) === 1 ? "" : "s"}`,
      icon: <TagOutlined className="text-lg text-purple-600" />,
      iconBg: "bg-purple-50",
    },
  ];

  const recentRegistrationsColumns: ColumnsType<DashboardRecentRegistration> = [
    {
      title: "Attendee",
      key: "attendee",
      width: 220,
      render: (_: unknown, record) => (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-medium text-dim-grey-900">
            {record.attendee.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-dim-grey-500">
            {record.attendee.email}
          </p>
        </div>
      ),
    },
    {
      title: "Event",
      key: "event",
      width: 240,
      ellipsis: { showTitle: false },
      render: (_: unknown, record) => (
        <Tooltip title={record.event.title}>
          <Link
            to={`/events/${record.event.id}`}
            className="block truncate font-medium text-dim-grey-800 hover:text-peach-fuzz-500 transition-colors"
          >
            {record.event.title}
          </Link>
        </Tooltip>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 96,
      align: "right",
      render: (quantity: number) => (
        <span className="font-semibold tabular-nums text-dim-grey-800">
          {quantity}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: RegistrationStatus) => {
        const config = STATUS_TAG_CONFIG[status] ?? {
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
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 120,
      align: "right",
      render: (totalPrice: number) => (
        <span className="font-semibold tabular-nums text-dim-grey-900 whitespace-nowrap">
          {formatBookingTotal(totalPrice)}
        </span>
      ),
    },
  ];

  const upcomingEventsColumns: ColumnsType<DashboardUpcomingEvent> = [
    {
      title: "Event",
      key: "title",
      width: 240,
      ellipsis: { showTitle: false },
      render: (_: unknown, record) => (
        <Tooltip title={record.title}>
          <Link
            to={`/events/${record.id}`}
            className="block truncate font-semibold text-dim-grey-900 hover:text-peach-fuzz-500 transition-colors"
          >
            {record.title}
          </Link>
        </Tooltip>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 140,
      render: (categoryName: string) => (
        <Tag color="purple" className="mr-0 font-medium">
          {categoryName}
        </Tag>
      ),
    },
    {
      title: "Date & Schedule",
      key: "schedule",
      width: 210,
      render: (_: unknown, record) => (
        <span className="text-xs text-dim-grey-700 whitespace-nowrap">
          {formatEventDateRange(record.startDate, record.endDate)}
        </span>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 210,
      ellipsis: { showTitle: false },
      render: (location: string) => {
        const displayLocation = location || "TBA";
        return (
          <Tooltip title={displayLocation}>
            <span className="inline-flex max-w-full items-center gap-1.5 text-xs text-dim-grey-600">
              <EnvironmentOutlined className="shrink-0 text-peach-fuzz-500" />
              <span className="truncate">{displayLocation}</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Tickets Booked",
      dataIndex: "ticketsBooked",
      key: "ticketsBooked",
      width: 120,
      align: "right",
      render: (ticketsBooked: number) => (
        <span className="font-semibold tabular-nums text-dim-grey-900">
          {ticketsBooked}
        </span>
      ),
    },
    {
      title: "Remaining Seats",
      key: "remainingSeats",
      width: 140,
      align: "right",
      render: (_: unknown, record) => {
        if (record.capacity === null || record.remainingSeats === null) {
          return (
            <Tag color="success" className="mr-0 font-medium">
              Open
            </Tag>
          );
        }
        if (record.remainingSeats === 0) {
          return (
            <Tag color="error" className="mr-0 font-medium">
              Sold Out
            </Tag>
          );
        }
        return (
          <span className="text-xs font-semibold tabular-nums text-dim-grey-700 whitespace-nowrap">
            {record.remainingSeats} / {record.capacity}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card
        className="rounded-2xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-6"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-peach-fuzz-500 uppercase">
                {SCOPE_LABELS[overview?.scope ?? "restricted"]}
              </span>
              <span className="text-dim-grey-300">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-dim-grey-500">
                <CalendarOutlined />
                {todayFormatted}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-dim-grey-900">
              Welcome back, {displayName}
            </h1>
            <p className="mt-0.5 text-sm text-dim-grey-600">
              Real-time overview of event performance, ticket demand, and
              upcoming schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="default"
              className="flex! items-center gap-1.5 text-xs!"
              loading={isLoading}
              onClick={() => dispatch(fetchDashboardOverview())}
            >
              <ReloadOutlined />
              Refresh
            </Button>
            {overview?.permissions.canViewEvents && (
              <Link to={ROUTES.EVENTS_MANAGEMENT}>
                <Button type="primary" className="text-xs!">
                  Manage Events
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {error && overview && (
        <Alert
          type="error"
          message="Could not refresh dashboard data"
          description={error}
          showIcon
          action={
            <Button
              type="default"
              className="text-xs!"
              onClick={() => dispatch(fetchDashboardOverview())}
            >
              Retry
            </Button>
          }
        />
      )}

      {overview?.scope === "restricted" && (
        <Alert
          type="info"
          message="Limited Dashboard Access"
          description="Your current role does not include event-management analytics. Only metrics permitted by your assigned permissions are displayed."
          showIcon
        />
      )}

      {/* KPI Cards */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          showUsersCard ? "xl:grid-cols-4" : "xl:grid-cols-3"
        }`}
      >
        {statCards.map((stat) => (
          <Card
            key={stat.key}
            className="h-full rounded-xl border border-dim-grey-200 bg-white shadow-xs transition-shadow hover:shadow-sm"
            bodyClassName="!p-5 flex flex-col justify-between h-full"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-dim-grey-500">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-dim-grey-900">
                  {stat.value.toLocaleString("en-IN")}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                {stat.icon}
              </div>
            </div>
            <p className="mt-3 text-xs text-dim-grey-500">{stat.subtitle}</p>
          </Card>
        ))}
      </div>

      {/* Primary Analytics Row: Registration Trends (Wider) + Events by Category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-8 rounded-xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6"
        >
          <div className="flex items-center justify-between border-b border-dim-grey-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-dim-grey-900">
                Registration Trends
              </h2>
              <p className="text-xs text-dim-grey-500">
                Active tickets booked and registration count over the last 30
                days
              </p>
            </div>
            <RiseOutlined className="text-lg text-peach-fuzz-500" />
          </div>

          <div className="mt-4">
            {trendChartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No booking activity in the last 30 days"
                />
              </div>
            ) : (
              <Area
                data={trendChartData}
                xField="date"
                yField="value"
                colorField="series"
                shapeField="smooth"
                height={290}
                style={{ fillOpacity: 0.2 }}
                scale={{
                  color: {
                    domain: ["Tickets Booked", "Registrations"],
                    range: ["#f4a261", "#3b82f6"],
                  },
                }}
                legend={{
                  color: {
                    position: "top",
                    layout: { justifyContent: "flex-end" },
                  },
                }}
                axis={{
                  x: { title: false },
                  y: { title: false },
                }}
              />
            )}
          </div>
        </Card>

        <Card
          className="lg:col-span-4 rounded-xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6"
        >
          <div className="flex items-center justify-between border-b border-dim-grey-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-dim-grey-900">
                Events by Category
              </h2>
              <p className="text-xs text-dim-grey-500">
                Distribution across categories
              </p>
            </div>
            <PieChartOutlined className="text-lg text-purple-500" />
          </div>

          <div className="mt-4">
            {categoryChartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No categorized events available"
                />
              </div>
            ) : (
              <Pie
                data={categoryChartData}
                angleField="value"
                colorField="type"
                innerRadius={0.62}
                height={290}
                scale={{
                  color: {
                    range: [
                      "#f4a261",
                      "#8b5cf6",
                      "#3b82f6",
                      "#10b981",
                      "#ec4899",
                      "#64748b",
                    ],
                  },
                }}
                label={{
                  text: (d: { value: number }) => `${d.value}`,
                  style: { fontWeight: "bold" },
                }}
                legend={{
                  color: {
                    position: "bottom",
                    layout: { justifyContent: "center" },
                  },
                }}
                tooltip={{
                  items: [
                    (d: { type: string; value: number }) => {
                      const pct =
                        totalCategoryEvents > 0
                          ? Math.round((d.value / totalCategoryEvents) * 100)
                          : 0;
                      return {
                        name: d.type,
                        value: `${d.value} event${d.value === 1 ? "" : "s"} (${pct}%)`,
                      };
                    },
                  ],
                }}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Secondary Analytics Row: Registration Status + Popular Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-5 rounded-xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6"
        >
          <div className="flex items-center justify-between border-b border-dim-grey-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-dim-grey-900">
                Registration Status
              </h2>
              <p className="text-xs text-dim-grey-500">
                Confirmed, pending, and cancelled bookings
              </p>
            </div>
            <CheckCircleOutlined className="text-lg text-emerald-500" />
          </div>

          <div className="mt-4">
            {totalStatusRecords === 0 || statusChartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No registration records yet"
                />
              </div>
            ) : (
              <Pie
                data={statusChartData}
                angleField="value"
                colorField="type"
                innerRadius={0.62}
                height={290}
                scale={{
                  color: {
                    domain: ["Confirmed", "Pending", "Cancelled"],
                    range: ["#10b981", "#f59e0b", "#94a3b8"],
                  },
                }}
                label={{
                  text: (d: { value: number }) => `${d.value}`,
                  style: { fontWeight: "bold" },
                }}
                legend={{
                  color: {
                    position: "bottom",
                    layout: { justifyContent: "center" },
                  },
                }}
                tooltip={{
                  items: [
                    (d: { type: string; value: number; tickets: number }) => {
                      const pct =
                        totalStatusRecords > 0
                          ? Math.round((d.value / totalStatusRecords) * 100)
                          : 0;
                      return {
                        name: d.type,
                        value: `${d.value} booking${d.value === 1 ? "" : "s"} · ${d.tickets} ticket${d.tickets === 1 ? "" : "s"} (${pct}%)`,
                      };
                    },
                  ],
                }}
              />
            )}
          </div>
        </Card>

        <Card
          className="lg:col-span-7 rounded-xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6"
        >
          <div className="flex items-center justify-between border-b border-dim-grey-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-dim-grey-900">
                Most Popular Events
              </h2>
              <p className="text-xs text-dim-grey-500">
                Top events ranked by active tickets booked
              </p>
            </div>
            <TrophyOutlined className="text-lg text-amber-500" />
          </div>

          <div className="mt-4">
            {popularChartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No active ticket bookings yet"
                />
              </div>
            ) : (
              <Bar
                data={popularChartData}
                xField="title"
                yField="ticketsBooked"
                colorField="title"
                height={290}
                legend={false}
                style={{
                  radiusTopRight: 6,
                  radiusBottomRight: 6,
                  maxWidth: 28,
                }}
                scale={{
                  color: {
                    range: [
                      "#f4a261",
                      "#fb923c",
                      "#8b5cf6",
                      "#3b82f6",
                      "#10b981",
                    ],
                  },
                }}
                axis={{
                  x: { title: false },
                  y: { title: "Tickets Booked" },
                }}
                tooltip={{
                  title: (d: { fullTitle: string }) => d.fullTitle,
                  items: [
                    (d: {
                      ticketsBooked: number;
                      estimatedBookingValue: number;
                    }) => ({
                      name: "Tickets Booked",
                      value: `${d.ticketsBooked} (Est. Booking Value: ${formatInr(d.estimatedBookingValue)})`,
                    }),
                  ],
                }}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Tables Section: Full-width Stacked Operational Tables */}
      <div className="space-y-6">
        <Card
          className="rounded-xl border border-dim-grey-200 bg-white shadow-xs overflow-hidden"
          bodyClassName="!p-0"
        >
          <div className="flex items-center justify-between border-b border-dim-grey-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-dim-grey-900">
                Recent Registrations
              </h2>
              <p className="text-xs text-dim-grey-500">
                Latest ticket bookings across accessible events
              </p>
            </div>
            <UserOutlined className="text-base text-dim-grey-400" />
          </div>
          <Table<DashboardRecentRegistration>
            rowKey="id"
            columns={recentRegistrationsColumns}
            dataSource={tables?.recentRegistrations ?? []}
            pagination={false}
            size="small"
            scroll={{ x: 760 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No recent registrations found"
                />
              ),
            }}
          />
        </Card>

        <Card
          className="rounded-xl border border-dim-grey-200 bg-white shadow-xs overflow-hidden"
          bodyClassName="!p-0"
        >
          <div className="flex items-center justify-between border-b border-dim-grey-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-dim-grey-900">
                Upcoming Published Events
              </h2>
              <p className="text-xs text-dim-grey-500">
                Next scheduled events and seat availability
              </p>
            </div>
            <Link
              to={ROUTES.EVENTS}
              className="text-xs font-semibold text-peach-fuzz-500 hover:text-peach-fuzz-600"
            >
              Public catalog &rarr;
            </Link>
          </div>
          <Table<DashboardUpcomingEvent>
            rowKey="id"
            columns={upcomingEventsColumns}
            dataSource={tables?.upcomingEvents ?? []}
            pagination={false}
            size="small"
            scroll={{ x: 860 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No upcoming published events"
                />
              ),
            }}
          />
        </Card>
      </div>
    </div>
  );
}

export default DashboardOverviewPage;
