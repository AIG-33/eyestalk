import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://eyestalk.app'),
  title: {
    default: 'EyesTalk — From a glance to a conversation',
    template: '%s · EyesTalk',
  },
  description:
    'Real-time, location-based social app for bars, clubs, lounges and more. Check in to a venue, see who is here, send a wave, and start a chat.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/logo-app-icon.svg',
  },
  openGraph: {
    title: 'EyesTalk — From a glance to a conversation',
    description:
      'Real-time, location-based social app for venues. See who is here, wave, chat.',
    url: 'https://eyestalk.app',
    siteName: 'EyesTalk',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-gray-950 text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
