import Image from 'next/image';
import Link from 'next/link';
import { COMPANY } from './company-info';

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
          {/* Brand block */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-mark.svg"
                alt="EyesTalk"
                width={40}
                height={40}
                style={{
                  filter: 'drop-shadow(0 0 16px rgba(124,111,247,0.45))',
                }}
              />
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.4px',
                }}
              >
                EyesTalk
              </span>
            </Link>
            <p
              className="mt-3 max-w-xs text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              From a glance to a conversation — meet the people around you,
              right where you are.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="eyebrow mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#how"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#venues"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  For venues
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Venue panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              className="eyebrow mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Terms of Service
                </Link>
              </li>
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

          {/* Contact */}
          <div>
            <h4
              className="eyebrow mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {COMPANY.email}
                </a>
              </li>
              <li
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {COMPANY.address}
              </li>
            </ul>
          </div>
        </div>

        {/* Operator + copyright row */}
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
            <span>·</span>
            <span>Made in Dubai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
