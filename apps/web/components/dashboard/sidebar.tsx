'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from './venue-context';

const navItems = [
  { href: '/dashboard', icon: '📊', labelKey: 'title', hintKey: 'titleHint' },
  { href: '/dashboard/live-screen', icon: '📺', labelKey: 'liveScreen', hintKey: 'liveScreenHint' },
  { href: '/dashboard/analytics', icon: '📈', labelKey: 'analytics', hintKey: 'analyticsHint' },
  { href: '/dashboard/activities', icon: '🎯', labelKey: 'activities', hintKey: 'activitiesHint' },
  { href: '/dashboard/services', icon: '🎟️', labelKey: 'services', hintKey: 'servicesHint' },
  { href: '/dashboard/announcements', icon: '📢', labelKey: 'announcements', hintKey: 'announcementsHint' },
  { href: '/dashboard/loyalty', icon: '🏆', labelKey: 'loyalty', hintKey: 'loyaltyHint' },
  { href: '/dashboard/moderation', icon: '🛡️', labelKey: 'moderation', hintKey: 'moderationHint' },
  { href: '/dashboard/qr-codes', icon: '📱', labelKey: 'qrCodes', hintKey: 'qrCodesHint' },
  { href: '/dashboard/settings', icon: '⚙️', labelKey: 'settings', hintKey: 'settingsHint' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tAuth = useTranslations('auth');
  const tVenues = useTranslations('venues');
  const { venues, current, switchVenue } = useVenue();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[60] md:hidden w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[69] md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

    <aside className={`fixed left-0 top-0 bottom-0 w-64 flex flex-col z-[70] transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
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
      </div>

      {/* Venue Selector */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {current ? (
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/5"
          >
            {current.logo_url ? (
              <Image src={current.logo_url} alt="" width={28} height={28} className="rounded-lg object-cover" unoptimized style={{ width: 28, height: 28 }} />
            ) : (
              <span className="text-lg">{getVenueEmoji(current.type)}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {current.name}
              </p>
              {venues.length > 1 && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {venues.length} venues
                </p>
              )}
            </div>
            <svg className={`w-4 h-4 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <Link
            href="/dashboard/create-venue"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors hover:bg-white/5"
          >
            <span className="text-lg">➕</span>
            <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
              {tVenues('createVenue')}
            </span>
          </Link>
        )}

        {/* Dropdown */}
        {showSwitcher && (
          <div className="mt-1 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {venues.map((v) => (
              <button
                key={v.id}
                onClick={() => { switchVenue(v.id); setShowSwitcher(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
              >
                {v.logo_url ? (
                  <Image src={v.logo_url} alt="" width={20} height={20} className="rounded object-cover" unoptimized style={{ width: 20, height: 20 }} />
                ) : (
                  <span className="text-sm">{getVenueEmoji(v.type)}</span>
                )}
                <span className="text-sm truncate flex-1" style={{ color: v.id === current?.id ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  {v.name}
                </span>
                {v.id === current?.id && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                )}
              </button>
            ))}
            <Link
              href="/dashboard/create-venue"
              onClick={() => setShowSwitcher(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-sm">➕</span>
              <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>
                {tVenues('addVenue')}
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/dashboard/activities' &&
              pathname.startsWith('/dashboard/activities/')) ||
            (item.href === '/dashboard/services' && pathname.startsWith('/dashboard/services'));
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
    </>
  );
}

const VENUE_EMOJI: Record<string, string> = {
  restaurant: '🍽️', cafe: '☕', bar: '🍸', nightclub: '🪩',
  sports_bar: '⚽', karaoke: '🎤', gym: '💪', coworking: '💻',
  beauty_salon: '💅', hotel: '🏨', lounge: '🛋️', event_space: '🎪',
  food_court: '🍔', bowling: '🎳', billiards: '🎱', hookah: '💨',
  board_games: '🎲', arcade: '🕹️', standup: '🎭', live_music: '🎵',
  other: '📍',
};

function getVenueEmoji(type: string): string {
  return VENUE_EMOJI[type] || '📍';
}
