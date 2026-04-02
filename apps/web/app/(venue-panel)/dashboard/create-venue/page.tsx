'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { VENUE_TYPES } from '@eyestalk/shared/constants';
import { useVenue } from '@/components/dashboard/venue-context';

const VenueMapPicker = dynamic(
  () => import('@/components/venue-map-picker').then((m) => m.VenueMapPicker),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div
      className="rounded-2xl animate-pulse"
      style={{ height: 400, backgroundColor: 'var(--bg-secondary)' }}
    />
  );
}

export default function CreateVenuePage() {
  const t = useTranslations('venues');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { addVenue } = useVenue();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'other' as string,
    description: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    geofence_radius: 50,
  });

  const hasCoords = form.latitude !== null && form.longitude !== null;

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setForm((prev) => ({
      ...prev,
      latitude: Math.round(lat * 1000000) / 1000000,
      longitude: Math.round(lng * 1000000) / 1000000,
      ...(address ? { address } : {}),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.latitude === null || form.longitude === null) {
      setError(t('coordsRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated. Please sign in again.');
        setLoading(false);
        return;
      }

      const payload = {
        owner_id: user.id,
        name: form.name,
        type: form.type,
        description: form.description || null,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        geofence_radius: form.geofence_radius,
      };

      console.log('Creating venue:', payload);

      const { data, error: insertError } = await supabase
        .from('venues')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`${insertError.message} (code: ${insertError.code})`);
        setLoading(false);
        return;
      }

      console.log('Venue created:', data);
      addVenue({
        id: data.id,
        name: data.name,
        type: data.type,
        logo_url: data.logo_url,
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err.message || 'Unexpected error');
      setLoading(false);
    }
  };

  const coordsDisplay = useMemo(() => {
    if (!hasCoords) return null;
    return `${form.latitude!.toFixed(6)}, ${form.longitude!.toFixed(6)}`;
  }, [form.latitude, form.longitude, hasCoords]);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {t('createVenue')}
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
        {t('createVenueHint')}
      </p>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Name + Type row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label={t('name')} hint={t('nameHint')}>
            <input
              type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. The Blue Room"
            />
          </Field>

          <Field label={t('type')} hint={t('typeHint')}>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input-field"
            >
              {VENUE_TYPES.map((vt) => (
                <option key={vt} value={vt}>{vt.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t('description')} hint={t('descriptionHint')}>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="input-field resize-none"
            placeholder="Best cocktails in town, live music on weekends..."
          />
        </Field>

        {/* Map section */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t('locationOnMap')}
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            {t('locationOnMapHint')}
          </p>
          <VenueMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            geofenceRadius={form.geofence_radius}
            onLocationSelect={handleLocationSelect}
            searchPlaceholder={t('searchPlaceholder')}
          />
        </div>

        {/* Coords display + address + geofence */}
        {hasCoords && (
          <div
            className="rounded-xl p-4 space-y-4"
            style={{
              backgroundColor: 'rgba(124,111,247,0.06)',
              border: '1px solid rgba(124,111,247,0.15)',
            }}
          >
            {/* Coordinates badge */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(124,111,247,0.15)',
                  color: 'var(--accent-light)',
                }}
              >
                📍 {coordsDisplay}
              </span>
            </div>

            <Field label={t('address')} hint={t('addressHint')}>
              <input
                type="text" required value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field"
                placeholder="123 Main Street"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t('geofence')} hint={t('geofenceHint')}>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10} max={500} step={10}
                    value={form.geofence_radius}
                    onChange={(e) => setForm({ ...form, geofence_radius: Number(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                  <span
                    className="text-sm font-mono min-w-[4rem] text-right"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {form.geofence_radius}m
                  </span>
                </div>
              </Field>
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-3 text-sm text-center"
            style={{
              backgroundColor: 'rgba(255,71,87,0.1)',
              border: '1px solid rgba(255,71,87,0.3)',
              color: 'var(--accent-error)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading || !hasCoords}
          className="w-full font-bold py-4 rounded-2xl text-white transition-all disabled:opacity-40 glow-primary"
          style={{ background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)', fontSize: 16 }}
        >
          {loading ? '...' : tCommon('create')}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {hint && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}
