import { Inter, Space_Grotesk } from 'next/font/google';
import localFont from 'next/font/local';

// Body / UI
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

// Numerics / token amounts
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Display / wordmark / titles — Clash Display (Fontshare, self-hosted)
export const clashDisplay = localFont({
  src: [
    { path: '../fonts/clash-display/ClashDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/clash-display/ClashDisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/clash-display/ClashDisplay-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/clash-display/ClashDisplay-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-clash',
  display: 'swap',
});

export const fontVariables = `${inter.variable} ${spaceGrotesk.variable} ${clashDisplay.variable}`;
