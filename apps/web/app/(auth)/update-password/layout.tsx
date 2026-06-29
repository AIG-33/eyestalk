import { pageTitle } from '@/lib/page-metadata';

export const metadata = pageTitle(
  'Choose a New Password',
  'Set a new password for your EyesTalk venue owner account.',
);

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
