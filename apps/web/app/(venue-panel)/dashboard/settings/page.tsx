'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { VENUE_TYPES } from '@eyestalk/shared/constants';

export default function SettingsPage() {
  const t = useTranslations('dashboard');
  const tVenues = useTranslations('venues');
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'other' as string,
    description: '',
    address: '',
    geofence_radius: 50,
  });

  useEffect(() => {
    loadVenue();
  }, []);

  const loadVenue = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (data) {
      setVenue(data);
      setForm({
        name: data.name,
        type: data.type,
        description: data.description || '',
        address: data.address,
        geofence_radius: data.geofence_radius,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!venue) return;
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from('venues')
      .update({
        name: form.name,
        type: form.type,
        description: form.description || null,
        address: form.address,
        geofence_radius: form.geofence_radius,
      })
      .eq('id', venue.id);

    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">{t('settings')}</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">{tVenues('name')}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">{tVenues('type')}</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          >
            {VENUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">{tVenues('description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">{tVenues('address')}</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Geofence Radius (meters)</label>
          <input
            type="number"
            value={form.geofence_radius}
            onChange={(e) => setForm({ ...form, geofence_radius: Number(e.target.value) })}
            min={10}
            max={500}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {saving ? '...' : t('settings') === 'Настройки' ? 'Сохранить' : 'Save'}
        </button>
      </div>
    </div>
  );
}
