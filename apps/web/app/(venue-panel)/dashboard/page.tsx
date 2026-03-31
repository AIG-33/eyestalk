import { createClient } from '@/lib/supabase/server';
import { useTranslations } from 'next-intl';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('owner_id', user!.id)
    .maybeSingle();

  let stats = { active_users: 0, total_checkins_today: 0, active_activities: 0 };

  if (venue) {
    const today = new Date().toISOString().split('T')[0];

    const [activeRes, checkinsRes, activitiesRes] = await Promise.all([
      supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('venue_id', venue.id).eq('status', 'active'),
      supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('venue_id', venue.id).gte('checked_in_at', `${today}T00:00:00`),
      supabase.from('activities').select('id', { count: 'exact', head: true }).eq('venue_id', venue.id).eq('status', 'active'),
    ]);

    stats = {
      active_users: activeRes.count || 0,
      total_checkins_today: checkinsRes.count || 0,
      active_activities: activitiesRes.count || 0,
    };
  }

  return <DashboardContent stats={stats} hasVenue={!!venue} />;
}

function DashboardContent({ stats, hasVenue }: { stats: { active_users: number; total_checkins_today: number; active_activities: number }; hasVenue: boolean }) {
  const t = useTranslations('dashboard');

  if (!hasVenue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-6xl mb-4">🏠</p>
          <h2 className="text-2xl font-bold text-white mb-2">No venue yet</h2>
          <p className="text-gray-400">Create your first venue to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">{t('activeUsers')}</p>
          <p className="text-3xl font-bold text-white">{stats.active_users}</p>
          <p className="text-xs text-green-400 mt-2">Live</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">{t('totalCheckins')}</p>
          <p className="text-3xl font-bold text-white">{stats.total_checkins_today}</p>
          <p className="text-xs text-gray-500 mt-2">Today</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">{t('activeActivities')}</p>
          <p className="text-3xl font-bold text-white">{stats.active_activities}</p>
          <p className="text-xs text-violet-400 mt-2">Running</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">{t('analytics')}</h2>
          <p className="text-gray-500">Charts coming in v2...</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">{t('activities')}</h2>
          <p className="text-gray-500">Create and manage activities here...</p>
        </div>
      </div>
    </div>
  );
}
