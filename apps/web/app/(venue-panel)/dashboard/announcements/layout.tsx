import { pageTitle, DASHBOARD_ROBOTS } from '@/lib/page-metadata';

export const metadata = {
  ...pageTitle('Announcements', 'Send promotions and time-sensitive offers to guests.'),
  robots: DASHBOARD_ROBOTS,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
