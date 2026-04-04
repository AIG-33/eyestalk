'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useVenue } from '@/components/dashboard/venue-context';

export default function DashboardPage() {
  const { current } = useVenue();
  const [stats, setStats] = useState({
    active_users: 0,
    total_checkins_today: 0,
    active_activities: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const venueId = current?.id;
    if (!venueId) {
      setStats({ active_users: 0, total_checkins_today: 0, active_activities: 0 });
      setStatsLoading(false);
      return;
    }

    let cancelled = false;
    setStatsLoading(true);

    (async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const [activeRes, checkinsRes, activitiesRes] = await Promise.all([
        supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venueId)
          .eq('status', 'active'),
        supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venueId)
          .gte('checked_in_at', `${today}T00:00:00`),
        supabase
          .from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venueId)
          .eq('status', 'active'),
      ]);

      if (cancelled) return;
      setStats({
        active_users: activeRes.count || 0,
        total_checkins_today: checkinsRes.count || 0,
        active_activities: activitiesRes.count || 0,
      });
      setStatsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  return (
    <DashboardContent
      stats={stats}
      hasVenue={!!current}
      statsLoading={statsLoading}
    />
  );
}

function DashboardContent({
  stats,
  hasVenue,
  statsLoading,
}: {
  stats: { active_users: number; total_checkins_today: number; active_activities: number };
  hasVenue: boolean;
  statsLoading: boolean;
}) {
  const t = useTranslations('dashboard');
  const tv = useTranslations('venues');

  if (!hasVenue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">🏠</p>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('noVenue')}
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            {t('noVenueHint')}
          </p>
          <Link
            href="/dashboard/create-venue"
            className="inline-block font-bold py-3 px-8 rounded-2xl text-white glow-primary"
            style={{ background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)' }}
          >
            {tv('createVenue')}
          </Link>
        </div>
      </div>
    );
  }

  const statDisplay = (n: number) => (statsLoading ? '…' : n);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('titleHint')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('activeUsers')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {statDisplay(stats.active_users)}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--accent-success)' }}>
            ● Live
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('activeUsersHint')}</p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('totalCheckins')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {statDisplay(stats.total_checkins_today)}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Today</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('totalCheckinsHint')}</p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('activeActivities')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {statDisplay(stats.active_activities)}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--accent-primary)' }}>Running</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('activeActivitiesHint')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          href="/dashboard/live-screen"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            📺 {t('liveScreen')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('liveScreenHint')}</p>
        </Link>
        <Link
          href="/dashboard/analytics"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            📈 {t('analytics')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('analyticsHint')}</p>
        </Link>
        <Link
          href="/dashboard/activities"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            🎯 {t('activities')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('activitiesHint')}</p>
        </Link>
        <Link
          href="/dashboard/moderation"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            🛡️ {t('moderation')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('moderationHint')}</p>
        </Link>
        <Link
          href="/dashboard/announcements"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            📢 {t('announcements')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('announcementsHint')}</p>
        </Link>
        <Link
          href="/dashboard/loyalty"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            🏆 {t('loyalty')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('loyaltyHint')}</p>
        </Link>
        <Link
          href="/dashboard/qr-codes"
          className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            📱 {t('qrCodes')}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{t('qrCodesHint')}</p>
        </Link>
      </div>
    </div>
  );
}
