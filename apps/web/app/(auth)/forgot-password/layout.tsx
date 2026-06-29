import { pageTitle } from '@/lib/page-metadata';

export const metadata = pageTitle(
  'Reset Password',
  'Request a password reset link for your EyesTalk venue owner account.',
);

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
