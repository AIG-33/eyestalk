'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

interface LiveData {
  venueName: string;
  activeCount: number;
  activities: { id: string; title: string; type: string; participants: number }[];
}

export default function LiveScreenPage() {
  const t = useTranslations('dashboard');
  const [data, setData] = useState<LiveData | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: venue } = await supabase
      .from('venues')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (!venue) return;

    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .eq('status', 'active');

    const { data: acts } = await supabase
      .from('activities')
      .select('id, title, type, current_participants')
      .eq('venue_id', venue.id)
      .eq('status', 'active');

    setData({
      venueName: venue.name,
      activeCount: count || 0,
      activities: (acts || []).map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        participants: a.current_participants,
      })),
    });
  };

  if (!data) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="text-gray-500 text-xl">Loading...</p>
      </div>
    );
  }

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black p-12 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-16">
        <div>
          <h1 className="text-6xl font-bold text-white tracking-tight">{data.venueName}</h1>
          <p className="text-violet-400 text-2xl mt-2 font-light">EyesTalk</p>
        </div>
        <div className="text-right">
          <p className="text-7xl font-light text-white tabular-nums">{timeStr}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-12 mb-16">
        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-10 flex-1">
          <p className="text-gray-400 text-xl mb-3">{t('activeUsers')}</p>
          <p className="text-8xl font-black text-white">{data.activeCount}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-10 flex-1">
          <p className="text-gray-400 text-xl mb-3">{t('activeActivities')}</p>
          <p className="text-8xl font-black text-white">{data.activities.length}</p>
        </div>
      </div>

      {/* Activities */}
      {data.activities.length > 0 && (
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-6">{t('activities')}</h2>
          <div className="grid grid-cols-2 gap-6">
            {data.activities.map((act) => (
              <div
                key={act.id}
                className="bg-violet-600/10 border border-violet-500/30 rounded-2xl p-8"
              >
                <p className="text-sm text-violet-300 uppercase tracking-wider mb-2">
                  {act.type.replace('_', ' ')}
                </p>
                <p className="text-3xl font-bold text-white mb-3">{act.title}</p>
                <p className="text-xl text-gray-400">
                  {act.participants} participant{act.participants !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-12 flex items-center justify-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-500 text-lg">Live — auto-refreshing</span>
      </div>
    </div>
  );
}
