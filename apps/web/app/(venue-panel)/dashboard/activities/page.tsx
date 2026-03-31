'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { ACTIVITY_TYPES } from '@eyestalk/shared/constants';

export default function ActivitiesPage() {
  const t = useTranslations('dashboard');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!venue) { setLoading(false); return; }
    setVenueId(venue.id);

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setActivities(data || []);
    setLoading(false);
  };

  const createActivity = async (form: { title: string; type: string; description: string }) => {
    if (!venueId) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const endsAt = new Date(now.getTime() + 60 * 60 * 1000);

    await supabase.from('activities').insert({
      venue_id: venueId,
      created_by: user.id,
      title: form.title,
      type: form.type,
      description: form.description || null,
      status: 'active',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    setShowCreate(false);
    loadActivities();
  };

  const EMOJI: Record<string, string> = {
    poll: '📊', contest: '🏆', tournament: '⚔️',
    challenge: '🎯', quest: '🗺️', auction: '💰',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">{t('activities')}</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showCreate ? 'Cancel' : 'Create Activity'}
        </button>
      </div>

      {showCreate && <CreateActivityForm onSubmit={createActivity} />}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : activities.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <p className="text-gray-400">No activities created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
              <span className="text-2xl">{EMOJI[act.type] || '🎯'}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{act.title}</p>
                <p className="text-gray-500 text-sm capitalize">{act.type}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[act.status] || ''}`}>
                {act.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateActivityForm({ onSubmit }: { onSubmit: (form: { title: string; type: string; description: string }) => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('poll');
  const [description, setDescription] = useState('');

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6 space-y-4">
      <input
        type="text"
        placeholder="Activity title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
      >
        {ACTIVITY_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
      />
      <button
        onClick={() => title && onSubmit({ title, type, description })}
        disabled={!title}
        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        Create
      </button>
    </div>
  );
}
