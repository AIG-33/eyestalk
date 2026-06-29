import { pageTitle, DASHBOARD_ROBOTS } from '@/lib/page-metadata';

export const metadata = {
  ...pageTitle('Dashboard', 'Venue overview — check-ins, activity, and quick links.'),
  robots: DASHBOARD_ROBOTS,
};

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
