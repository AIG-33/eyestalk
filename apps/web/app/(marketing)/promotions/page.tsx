import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/components/site/company-info';
import { MarketingPageShell } from '@/components/site/marketing-page-shell';

export const metadata: Metadata = {
  title: 'Promotions & Announcements',
  description: `Run venue promotions on ${COMPANY.brand}: announcements, loyalty rewards, polls, quests, and timed activities.`,
};

const promotions = [
  {
    title: 'Announcements',
    body: 'Push time-sensitive offers, event line-ups, and happy-hour deals to everyone checked in at your venue.',
  },
  {
    title: 'Loyalty & tokens',
    body: 'Reward repeat guests with tokens they can spend on activities, votes, and exclusive venue perks.',
  },
  {
    title: 'Live activities',
    body: 'Host polls, quests, tournaments, contests, and auctions that keep the room engaged throughout the night.',
  },
  {
    title: 'Targeted reach',
    body: 'Promotions reach only guests who are checked in — real presence, real engagement, no wasted impressions.',
  },
];

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Promotions' },
];

export default function PromotionsPage() {
  return (
    <MarketingPageShell
      title="Promotions & Announcements"
      subtitle="Turn slow nights into packed rooms with targeted offers and live venue activities."
      breadcrumbs={breadcrumbs}
      currentPath="/promotions"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {promotions.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border p-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <div
        className="mt-10 rounded-3xl border p-6 sm:p-8"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Get started
        </h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Promotions work alongside{' '}
          <Link href="/services" className="underline hover:opacity-80">
            venue services
          </Link>{' '}
          like check-in, live screen, and analytics.{' '}
          <Link href="/login" className="underline hover:opacity-80">
            Sign in to the venue panel
          </Link>{' '}
          to create your first announcement, or{' '}
          <Link href="/contact" className="underline hover:opacity-80">
            contact us
          </Link>{' '}
          for onboarding help.
        </p>
      </div>
    </MarketingPageShell>
  );
}
