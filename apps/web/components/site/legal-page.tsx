import Link from 'next/link';
import { SiteBreadcrumbs, type BreadcrumbItem } from '@/components/site/site-breadcrumbs';

export type LegalLang = 'en' | 'ru';

export function resolveLang(value: string | string[] | undefined): LegalLang {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'ru' ? 'ru' : v === 'en' ? 'en' : ('en' as LegalLang);
}

const LEGAL_BREADCRUMBS: Record<
  '/privacy' | '/terms' | '/delete-account',
  BreadcrumbItem[]
> = {
  '/privacy': [
    { label: 'Home', href: '/' },
    { label: 'Privacy Policy' },
  ],
  '/terms': [
    { label: 'Home', href: '/' },
    { label: 'Terms of Service' },
  ],
  '/delete-account': [
    { label: 'Home', href: '/' },
    { label: 'Delete account' },
  ],
};

export function LegalPage({
  title,
  meta,
  lang,
  basePath,
  defaultLang,
  children,
}: {
  title: string;
  meta: string;
  lang: LegalLang;
  basePath: '/privacy' | '/terms' | '/delete-account';
  defaultLang: LegalLang;
  children: React.ReactNode;
}) {
  const otherLang: LegalLang = lang === 'ru' ? 'en' : 'ru';
  const otherLangLabel = otherLang === 'ru' ? 'Русский' : 'English';
  const otherHref =
    otherLang === defaultLang ? basePath : `${basePath}?lang=${otherLang}`;

  return (
    <div className="relative px-5 pb-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <SiteBreadcrumbs
          items={LEGAL_BREADCRUMBS[basePath]}
          currentPath={basePath}
        />
        <article
          className="legal-prose rounded-3xl border p-6 sm:p-10"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div
              className="eyebrow"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {meta}
            </div>
            <Link
              href={otherHref}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'var(--text-secondary)',
              }}
            >
              {otherLangLabel}
            </Link>
          </div>
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
          <div className="mt-8" style={{ color: 'var(--text-primary)' }}>
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
