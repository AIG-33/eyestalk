/**
 * Single source of truth for public site navigation and internal linking.
 */

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

/** Primary header navigation — visible on desktop; condensed on mobile. */
export const HEADER_NAV: NavItem[] = [
  { label: 'How it works', href: '/#how' },
  { label: 'Features', href: '/#features' },
  { label: 'Services', href: '/services' },
  { label: 'For venues', href: '/#venues' },
  { label: 'Promotions', href: '/promotions' },
  { label: 'Contact', href: '/contact' },
];

/** Footer columns for structured site hierarchy. */
export const FOOTER_NAV = {
  product: [
    { label: 'How it works', href: '/#how' },
    { label: 'Features', href: '/#features' },
    { label: 'For venues', href: '/#venues' },
    { label: 'Services', href: '/services' },
    { label: 'Promotions', href: '/promotions' },
    { label: 'Venue panel', href: '/login' },
  ] satisfies NavItem[],
  company: [
    { label: 'Contact', href: '/contact' },
    { label: 'Address', href: '/contact#address' },
  ] satisfies NavItem[],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Delete account', href: '/delete-account' },
  ] satisfies NavItem[],
} as const;

/** Public indexable routes for sitemap generation. */
export const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/promotions', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/delete-account', priority: 0.4, changeFrequency: 'yearly' },
];
