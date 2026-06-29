import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/components/site/company-info';
import { MarketingPageShell } from '@/components/site/marketing-page-shell';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with the ${COMPANY.brand} team — support, legal inquiries, and company address in Dubai.`,
};

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Contact' },
];

export default function ContactPage() {
  return (
    <MarketingPageShell
      title="Contact"
      subtitle="Reach the EyesTalk team for support, partnerships, or legal inquiries."
      breadcrumbs={breadcrumbs}
      currentPath="/contact"
    >
      <div className="space-y-10">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            General support
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Questions about the app, venue onboarding, or your account.
          </p>
          <a
            href={`mailto:${COMPANY.email}`}
            className="mt-4 inline-block font-semibold transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent-light)' }}
          >
            {COMPANY.email}
          </a>
        </section>

        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Legal inquiries
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Privacy, data requests, and compliance matters.
          </p>
          <a
            href={`mailto:${COMPANY.legalEmail}`}
            className="mt-4 inline-block font-semibold transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent-light)' }}
          >
            {COMPANY.legalEmail}
          </a>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            See also{' '}
            <Link href="/privacy" className="underline hover:opacity-80">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="underline hover:opacity-80">
              Terms of Service
            </Link>
            .
          </p>
        </section>

        <section
          id="address"
          className="rounded-3xl border p-6 sm:p-8 scroll-mt-24"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Address
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {COMPANY.legalNameFull}
            <br />
            {COMPANY.address}
          </p>
          <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            License No. {COMPANY.licenseNumber} · {COMPANY.licenseAuthority} · TRN{' '}
            {COMPANY.taxNumber}
          </p>
        </section>

        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Venue owners
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ready to bring EyesTalk to your venue? Explore{' '}
            <Link href="/services" className="underline hover:opacity-80">
              venue services
            </Link>{' '}
            and{' '}
            <Link href="/promotions" className="underline hover:opacity-80">
              promotions tools
            </Link>
            , then{' '}
            <Link href="/login" className="underline hover:opacity-80">
              sign in to the venue panel
            </Link>
            .
          </p>
        </section>
      </div>
    </MarketingPageShell>
  );
}
