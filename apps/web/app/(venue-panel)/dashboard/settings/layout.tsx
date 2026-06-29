import { pageTitle, DASHBOARD_ROBOTS } from '@/lib/page-metadata';

export const metadata = {
  ...pageTitle('Settings', 'Venue profile, branding, and account preferences.'),
  robots: DASHBOARD_ROBOTS,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
