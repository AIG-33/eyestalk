import Link from 'next/link';
import { COMPANY } from './company-info';
import { FOOTER_NAV } from './site-nav';
import { Wordmark } from '@/components/site/wordmark';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center">
              <Wordmark fontSize={22} />
            </Link>
            <p
              className="mt-3 max-w-xs text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              From a glance to a conversation — meet the people around you,
              right where you are.
            </p>
          </div>

          <div>
            <h4
              className="eyebrow mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_NAV.product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-opacity hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="eyebrow mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_NAV.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-opacity hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="eyebrow mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_NAV.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-opacity hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${COMPANY.legalEmail}`}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Legal inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            color: 'var(--text-tertiary)',
          }}
        >
          <div className="space-y-1">
            <div>
              © {year} {COMPANY.legalName}. All rights reserved.
            </div>
            <div>
              {COMPANY.legalNameFull} · License No. {COMPANY.licenseNumber} ·
              TRN {COMPANY.taxNumber}
            </div>
            <div>{COMPANY.addressShort}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/privacy"
              className="transition-opacity hover:opacity-80"
            >
              Privacy
            </Link>
            <Link href="/terms" className="transition-opacity hover:opacity-80">
              Terms
            </Link>
            <Link
              href="/delete-account"
              className="transition-opacity hover:opacity-80"
            >
              Delete account
            </Link>
            <span>·</span>
            <Link href="/contact" className="transition-opacity hover:opacity-80">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
