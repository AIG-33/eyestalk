'use client';

import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--accent-light)' }}
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
