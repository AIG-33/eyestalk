'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  venue: {
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
  } | null;
}

const navItems = [
  { href: '/dashboard', icon: '📊', labelKey: 'title', hintKey: 'titleHint' },
  { href: '/dashboard/analytics', icon: '📈', labelKey: 'analytics', hintKey: 'analyticsHint' },
  { href: '/dashboard/activities', icon: '🎯', labelKey: 'activities', hintKey: 'activitiesHint' },
  { href: '/dashboard/moderation', icon: '🛡️', labelKey: 'moderation', hintKey: 'moderationHint' },
  { href: '/dashboard/qr-codes', icon: '📱', labelKey: 'qrCodes', hintKey: 'qrCodesHint' },
  { href: '/dashboard/live-screen', icon: '📺', labelKey: 'liveScreen', hintKey: 'liveScreenHint' },
  { href: '/dashboard/settings', icon: '⚙️', labelKey: 'settings', hintKey: 'settingsHint' },
];

export function DashboardSidebar({ venue }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tAuth = useTranslations('auth');

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="EyesTalk" width={28} height={28} />
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            EyesTalk
          </h1>
        </div>
        {venue && (
          <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            {venue.name}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group"
              style={{
                backgroundColor: isActive ? 'rgba(124,111,247,0.15)' : 'transparent',
                color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 0 12px rgba(124,111,247,0.1)' : 'none',
              }}
              title={t(item.hintKey)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{t(item.labelKey)}</span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--glow-primary)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-error)' }}
        >
          {tAuth('signOut')}
        </button>
      </div>
    </aside>
  );
}
