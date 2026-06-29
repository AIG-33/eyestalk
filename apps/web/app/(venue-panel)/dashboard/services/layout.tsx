import { pageTitle, DASHBOARD_ROBOTS } from '@/lib/page-metadata';

export const metadata = {
  ...pageTitle('Services', 'Publish your venue service catalog for checked-in guests.'),
  robots: DASHBOARD_ROBOTS,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
