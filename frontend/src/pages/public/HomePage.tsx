import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.ts';

export function HomePage(): ReactElement {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <span className="text-sm font-bold tracking-wider text-peach-fuzz-500 uppercase">
          EventSphere
        </span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-dim-grey-900 sm:text-5xl lg:text-6xl">
          Discover and Manage Events
        </h1>
        <p className="mt-4 max-w-2xl text-base text-dim-grey-600 sm:text-lg">
          Your all-in-one platform to explore upcoming events, book workshop
          tickets, and manage your own experiences seamlessly.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={ROUTES.EVENTS}
            className="rounded-lg bg-peach-fuzz-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-peach-fuzz-600"
          >
            Explore Events
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="border-t border-dim-grey-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-dim-grey-900 sm:text-3xl">
              Everything you need to experience great events
            </h2>
            <p className="mt-2 text-sm text-dim-grey-600">
              Built for event attendees, organizers, and workshop leaders.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-dim-grey-200 bg-dim-grey-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-peach-fuzz-100 text-peach-fuzz-600">
                📅
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dim-grey-900">
                Discover Curated Events
              </h3>
              <p className="mt-2 text-sm text-dim-grey-600">
                Find conferences, seminars, meetups, and workshops tailored to
                your interests and career goals.
              </p>
            </div>

            <div className="rounded-xl border border-dim-grey-200 bg-dim-grey-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-peach-fuzz-100 text-peach-fuzz-600">
                🎟️
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dim-grey-900">
                Instant Registration
              </h3>
              <p className="mt-2 text-sm text-dim-grey-600">
                Book tickets securely, download digital passes, and keep track
                of all your registrations in one place.
              </p>
            </div>

            <div className="rounded-xl border border-dim-grey-200 bg-dim-grey-50/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-peach-fuzz-100 text-peach-fuzz-600">
                📊
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dim-grey-900">
                Organizer Dashboard
              </h3>
              <p className="mt-2 text-sm text-dim-grey-600">
                Powerful tools for hosts to track attendance, manage tickets,
                and communicate with participants effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
