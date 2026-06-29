import { pageTitle } from '@/lib/page-metadata';

export const metadata = pageTitle(
  'Venue Owner Login',
  'Sign in to the EyesTalk venue panel to manage check-ins, activities, and promotions.',
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
