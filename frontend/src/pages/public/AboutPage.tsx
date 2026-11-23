import type { ReactElement } from 'react';
import { Card } from '../../components/common';

export function AboutPage(): ReactElement {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-sm font-bold tracking-wider text-peach-fuzz-500 uppercase">
          About Us
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-dim-grey-900 sm:text-4xl">
          Empowering Communities Through Experiences
        </h1>
        <p className="mt-4 text-base text-dim-grey-600 sm:text-lg">
          EventSphere is a unified event and workshop management platform
          engineered to make discovering, booking, and hosting memorable
          gatherings simple, transparent, and enjoyable.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card
          className="rounded-xl border border-dim-grey-200 bg-white"
          bodyClassName="!p-8"
        >
          <h2 className="text-xl font-bold text-dim-grey-900">Our Mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-dim-grey-600">
            To bridge the gap between passionate event organizers and curious
            attendees. We believe meaningful learning, networking, and
            collaboration happen when event discovery and ticketing are
            frictionless.
          </p>
        </Card>

        <Card
          className="rounded-xl border border-dim-grey-200 bg-white"
          bodyClassName="!p-8"
        >
          <h2 className="text-xl font-bold text-dim-grey-900">Our Vision</h2>
          <p className="mt-3 text-sm leading-relaxed text-dim-grey-600">
            To build the leading ecosystem for professional workshops, tech
            summits, and creative gatherings, providing world-class tools for
            both in-person and digital event experiences.
          </p>
        </Card>
      </div>

      {/* Pillars */}
      <div className="mt-14">
        <h2 className="text-center text-2xl font-bold text-dim-grey-900">
          What Sets EventSphere Apart
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-dim-grey-200 bg-white p-6 text-center">
            <span className="text-2xl">✨</span>
            <h3 className="mt-3 font-semibold text-dim-grey-900">
              Seamless Experience
            </h3>
            <p className="mt-2 text-xs text-dim-grey-600">
              Clean, responsive design with zero clutter, so you focus on what
              matters.
            </p>
          </div>

          <div className="rounded-xl border border-dim-grey-200 bg-white p-6 text-center">
            <span className="text-2xl">🔒</span>
            <h3 className="mt-3 font-semibold text-dim-grey-900">
              Secure & Reliable
            </h3>
            <p className="mt-2 text-xs text-dim-grey-600">
              Built with robust authentication, role-based access, and reliable
              data protection.
            </p>
          </div>

          <div className="rounded-xl border border-dim-grey-200 bg-white p-6 text-center">
            <span className="text-2xl">📈</span>
            <h3 className="mt-3 font-semibold text-dim-grey-900">
              Actionable Insights
            </h3>
            <p className="mt-2 text-xs text-dim-grey-600">
              Comprehensive dashboards giving organizers real-time attendee and
              event tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
