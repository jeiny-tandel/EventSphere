import type { ReactElement } from 'react';
import { Card } from '../../components/common';

interface DemoEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  description: string;
}

const DEMO_EVENTS: DemoEvent[] = [
  {
    id: '1',
    title: 'Tech Innovators Summit 2026',
    category: 'Conference',
    date: 'Dec 15, 2026 • 9:00 AM',
    location: 'San Francisco, CA & Online',
    description:
      'Join industry leaders to discuss emerging trends in artificial intelligence, cloud infrastructure, and modern software design.',
  },
  {
    id: '2',
    title: 'React 19 & Next-Gen Frontend Workshop',
    category: 'Workshop',
    date: 'Dec 22, 2026 • 2:00 PM',
    location: 'Interactive Virtual Session',
    description:
      'Hands-on deep dive into React 19 compiler features, Server Actions, modern state management, and real-world architectures.',
  },
  {
    id: '3',
    title: 'Design Systems & UI Engineering Meetup',
    category: 'Meetup',
    date: 'Jan 10, 2027 • 6:30 PM',
    location: 'Austin, TX',
    description:
      'A community gathering focused on scalable token systems, accessible component libraries, and cross-platform design cohesion.',
  },
];

export function EventsPage(): ReactElement {
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
          EventSphere. Real-time event catalog integration coming soon.
        </p>
      </div>

      {/* Events Grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DEMO_EVENTS.map((event) => (
          <Card
            key={event.id}
            className="flex flex-col justify-between rounded-xl border border-dim-grey-200 bg-white shadow-xs transition-shadow hover:shadow-md"
            bodyClassName="!p-6 flex flex-col h-full"
          >
            <div>
              <span className="inline-block rounded-full bg-peach-fuzz-100 px-3 py-1 text-xs font-semibold text-peach-fuzz-700">
                {event.category}
              </span>
              <h2 className="mt-3 text-lg font-bold text-dim-grey-900">
                {event.title}
              </h2>
              <div className="mt-2 space-y-1 text-xs text-dim-grey-500">
                <p>🗓️ {event.date}</p>
                <p>📍 {event.location}</p>
              </div>
              <p className="mt-3 text-sm text-dim-grey-600 line-clamp-3">
                {event.description}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-dim-grey-100">
              <span className="text-xs font-medium text-peach-fuzz-500">
                Registration opening soon &rarr;
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default EventsPage;
