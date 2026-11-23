import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import { ROUTES } from '../../constants/routes.ts';
import { useAppSelector } from '../../hooks/redux.ts';

interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  change: string;
  icon: string;
}

const DEMO_METRICS: StatMetric[] = [
  {
    id: '1',
    label: 'Registered Events',
    value: 4,
    change: '+2 this month',
    icon: '🎟️',
  },
  {
    id: '2',
    label: 'Upcoming Workshops',
    value: 2,
    change: 'Next in 3 days',
    icon: '🗓️',
  },
  {
    id: '3',
    label: 'Completed Events',
    value: 8,
    change: '100% attendance rate',
    icon: '✅',
  },
  {
    id: '4',
    label: 'Saved Events',
    value: 5,
    change: 'Book before deadline',
    icon: '⭐',
  },
];

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  status: 'Confirmed' | 'Pending';
}

const DEMO_UPCOMING: UpcomingEvent[] = [
  {
    id: 'evt-1',
    title: 'React 19 & Next-Gen Frontend Workshop',
    date: 'Dec 15, 2026',
    time: '2:00 PM - 5:00 PM',
    location: 'Virtual Classroom (Zoom)',
    category: 'Workshop',
    status: 'Confirmed',
  },
  {
    id: 'evt-2',
    title: 'Tech Innovators Summit 2026',
    date: 'Dec 22, 2026',
    time: '9:00 AM - 6:00 PM',
    location: 'Convention Center, Hall A',
    category: 'Conference',
    status: 'Confirmed',
  },
  {
    id: 'evt-3',
    title: 'Cloud Architecture & Microservices Masterclass',
    date: 'Jan 08, 2027',
    time: '10:00 AM - 1:00 PM',
    location: 'Virtual Stream',
    category: 'Masterclass',
    status: 'Pending',
  },
];

interface RecentActivity {
  id: string;
  title: string;
  timestamp: string;
  description: string;
}

const DEMO_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    title: 'Registration Confirmed',
    timestamp: '2 hours ago',
    description: 'Registered for React 19 & Next-Gen Frontend Workshop.',
  },
  {
    id: 'act-2',
    title: 'Summit Pass Booked',
    timestamp: 'Yesterday',
    description: 'Confirmed seat for Tech Innovators Summit 2026.',
  },
  {
    id: 'act-3',
    title: 'Profile Updated',
    timestamp: '3 days ago',
    description: 'Updated phone number and notification preferences.',
  },
];

export function DashboardOverviewPage(): ReactElement {
  const { user } = useAppSelector((state) => state.auth);
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'User';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-dim-grey-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold tracking-wider text-peach-fuzz-500 uppercase">
              Overview
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-dim-grey-900 sm:text-3xl">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-dim-grey-600">
              Here is what is happening with your registered events, workshops,
              and recent activities.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link to={ROUTES.EVENTS}>
              <Button type="primary">Browse Events</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_METRICS.map((metric) => (
          <Card
            key={metric.id}
            className="rounded-xl border border-dim-grey-200 bg-white"
            bodyClassName="!p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-dim-grey-600">
                {metric.label}
              </span>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-dim-grey-900">
                {metric.value}
              </span>
              <p className="mt-1 text-xs text-dim-grey-500">{metric.change}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid: Upcoming Events & Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Upcoming Events Column */}
        <div className="lg:col-span-2">
          <Card
            className="rounded-xl border border-dim-grey-200 bg-white"
            bodyClassName="!p-6"
          >
            <div className="flex items-center justify-between border-b border-dim-grey-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-dim-grey-900">
                  Your Upcoming Events
                </h2>
                <p className="text-xs text-dim-grey-500">
                  Workshops and conferences you are scheduled to attend.
                </p>
              </div>
              <Link
                to={ROUTES.EVENTS}
                className="text-xs font-semibold text-peach-fuzz-500 hover:text-peach-fuzz-600"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="mt-4 divide-y divide-dim-grey-100">
              {DEMO_UPCOMING.map((event) => (
                <div key={event.id} className="py-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-peach-fuzz-50 px-2 py-0.5 text-xs font-medium text-peach-fuzz-700">
                      {event.category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        event.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-dim-grey-900">
                    {event.title}
                  </h3>
                  <p className="text-xs text-dim-grey-500">
                    🗓️ {event.date} • {event.time}
                  </p>
                  <p className="text-xs text-dim-grey-500">
                    📍 {event.location}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card
            className="rounded-xl border border-dim-grey-200 bg-white"
            bodyClassName="!p-6"
          >
            <h2 className="text-base font-bold text-dim-grey-900">
              Quick Actions
            </h2>
            <div className="mt-4 space-y-2">
              <Link
                to={ROUTES.EVENTS}
                className="flex items-center justify-between rounded-lg border border-dim-grey-200 bg-dim-grey-50/50 p-3 text-sm font-medium text-dim-grey-800 transition-colors hover:bg-dim-grey-100"
              >
                <span>🔍 Find New Workshops</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card
            className="rounded-xl border border-dim-grey-200 bg-white"
            bodyClassName="!p-6"
          >
            <h2 className="text-base font-bold text-dim-grey-900">
              Recent Activity
            </h2>
            <div className="mt-4 space-y-4">
              {DEMO_ACTIVITIES.map((act) => (
                <div key={act.id} className="relative pl-5 text-xs">
                  <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-peach-fuzz-500" />
                  <p className="font-semibold text-dim-grey-900">{act.title}</p>
                  <p className="mt-0.5 text-dim-grey-600">{act.description}</p>
                  <p className="mt-1 text-[11px] text-dim-grey-400">
                    {act.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewPage;
