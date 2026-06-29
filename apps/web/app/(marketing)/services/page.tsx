import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/components/site/company-info';
import { MarketingPageShell } from '@/components/site/marketing-page-shell';

export const metadata: Metadata = {
  title: 'Venue Services',
  description: `Tools for venue owners on ${COMPANY.brand}: check-in, live screen, service catalog, analytics, moderation, and QR codes.`,
};

const services = [
  {
    title: 'QR check-in & geofence',
    body: 'Guests scan a venue QR or enter the geofence to check in. Only people who are actually on-site appear in the room.',
    href: '/#how',
  },
  {
    title: 'Live screen',
    body: 'Display real-time venue activity on screens — check-ins, waves, and live engagement metrics for staff and guests.',
    href: '/login',
  },
  {
    title: 'Service catalog',
    body: 'Publish your menu, spa treatments, table service, or any venue offerings directly in the app for checked-in guests.',
    href: '/login',
  },
  {
    title: 'Analytics',
    body: 'Track check-ins, active users, engagement trends, and activity performance to understand what drives your busiest nights.',
    href: '/login',
  },
  {
    title: 'Moderation & safety',
    body: 'Review reports, manage blocked users, and keep your venue a safe space with venue-side moderation tools.',
    href: '/login',
  },
  {
    title: 'QR codes',
    body: 'Generate and print venue QR codes for tables, entrances, and promotional materials — one scan to check in.',
    href: '/login',
  },
];

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Services' },
];

export default function ServicesPage() {
  return (
    <MarketingPageShell
      title="Venue Services"
      subtitle="Everything venue owners need to run EyesTalk — from check-in to analytics."
      breadcrumbs={breadcrumbs}
      currentPath="/services"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {services.map((service) => (
          <article
            key={service.title}
            className="rounded-3xl border p-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {service.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {service.body}
            </p>
            <Link
              href={service.href}
              className="mt-4 inline-block text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: 'var(--accent-light)' }}
            >
              Learn more →
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Pair services with{' '}
        <Link href="/promotions" className="underline hover:opacity-80">
          promotions & announcements
        </Link>{' '}
        to fill your venue on slow nights. Questions?{' '}
        <Link href="/contact" className="underline hover:opacity-80">
          Contact us
        </Link>
        .
      </p>
    </MarketingPageShell>
  );
}
