import { pageTitle, DASHBOARD_ROBOTS } from '@/lib/page-metadata';

export const metadata = {
  ...pageTitle('Activities', 'Manage polls, quests, tournaments, and other venue activities.'),
  robots: DASHBOARD_ROBOTS,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
