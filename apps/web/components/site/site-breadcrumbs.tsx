import Link from 'next/link';
import { COMPANY } from '@/components/site/company-info';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

function buildBreadcrumbJsonLd(items: BreadcrumbItem[], currentPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1;
      const path = isLast && !item.href ? currentPath : item.href ?? '/';
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: `${COMPANY.url}${path.startsWith('/') ? path : `/${path}`}`,
      };
    }),
  };
}

export function SiteBreadcrumbs({
  items,
  currentPath,
}: {
  items: BreadcrumbItem[];
  currentPath: string;
}) {
  const jsonLd = buildBreadcrumbJsonLd(items, currentPath);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        className="mb-8 flex flex-wrap items-center gap-1.5 text-sm"
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>
                  /
                </span>
              )}
              {item.href && i < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--accent-light)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-current={i === items.length - 1 ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
