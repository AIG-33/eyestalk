import { pageTitle, DASHBOARD_ROBOTS } from '@/lib/page-metadata';

export const metadata = {
  ...pageTitle('Analytics', 'Check-in trends, engagement metrics, and venue performance.'),
  robots: DASHBOARD_ROBOTS,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
