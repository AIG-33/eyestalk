import { SiteBreadcrumbs, type BreadcrumbItem } from '@/components/site/site-breadcrumbs';

export function MarketingPageShell({
  title,
  subtitle,
  breadcrumbs,
  currentPath,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  currentPath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative px-5 pb-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <SiteBreadcrumbs items={breadcrumbs} currentPath={currentPath} />
        <header className="mb-10">
          <h1
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="mt-4 max-w-2xl text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
