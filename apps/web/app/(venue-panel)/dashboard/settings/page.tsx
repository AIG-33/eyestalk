'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { VENUE_TYPES } from '@eyestalk/shared/constants';
import { useVenue } from '@/components/dashboard/venue-context';
import { useTheme } from '@/components/dashboard/theme-context';

export default function SettingsPage() {
  const t = useTranslations('dashboard');
  const tVenues = useTranslations('venues');
  const router = useRouter();
  const { current, removeVenue, updateVenue } = useVenue();
  const { theme, setTheme } = useTheme();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'other' as string,
    description: '',
    address: '',
    geofence_radius: 50,
  });

  const loadVenue = useCallback(async () => {
    const venueId = current?.id;
    if (!venueId) {
      setVenue(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .maybeSingle();

    if (data) {
      setVenue(data);
      setLogoUrl(data.logo_url || null);
      setForm({
        name: data.name,
        type: data.type,
        description: data.description || '',
        address: data.address,
        geofence_radius: data.geofence_radius,
      });
    } else {
      setVenue(null);
    }
    setLoading(false);
  }, [current?.id]);

  useEffect(() => {
    setLoading(true);
    void loadVenue();
  }, [loadVenue]);

  const handleSave = async () => {
    if (!venue) return;
    setSaving(true);

    const supabase = createClient();
    await supabase.from('venues')
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venue) return;

    setUploadingLogo(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${venue.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('venue-logos')
      .upload(filePath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      setUploadingLogo(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-logos')
      .getPublicUrl(filePath);

    const newUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from('venues')
      .update({ logo_url: newUrl })
      .eq('id', venue.id);

    setLogoUrl(newUrl);
    updateVenue(venue.id, { logo_url: newUrl });
    setUploadingLogo(false);
  };

  const handleLogoRemove = async () => {
    if (!venue) return;
    setUploadingLogo(true);
    const supabase = createClient();

    const { data: files } = await supabase.storage
      .from('venue-logos')
      .list(venue.id);

    if (files && files.length > 0) {
      await supabase.storage
        .from('venue-logos')
        .remove(files.map((f) => `${venue.id}/${f.name}`));
    }

    await supabase.from('venues')
      .update({ logo_url: null })
      .eq('id', venue.id);

    setLogoUrl(null);
    updateVenue(venue.id, { logo_url: null });
    setUploadingLogo(false);
  };

  const handleDelete = async () => {
    if (!venue) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/v1/venue-admin/${venue.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete venue');
      }

      removeVenue(venue.id);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Delete venue error:', err);
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  if (!current?.id) {
    return (
      <div className="p-8 text-gray-400">No venue selected.</div>
    );
  }

  if (!venue) {
    return (
      <div className="p-8 text-gray-400">Could not load venue.</div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>{t('settings')}</h1>

      {/* Theme Toggle */}
      <div className="mb-10 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('settings') === 'Настройки' ? 'Тема оформления' : 'Appearance'}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
          {t('settings') === 'Настройки'
            ? 'Выберите светлую или тёмную тему для панели управления'
            : 'Choose between light or dark theme for the dashboard'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl transition-all"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(124,111,247,0.15)' : 'var(--bg-tertiary)',
              border: `2px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'transparent'}`,
              boxShadow: theme === 'dark' ? 'var(--glow-primary)' : 'none',
            }}
          >
            <span className="text-2xl">🌙</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('settings') === 'Настройки' ? 'Тёмная' : 'Dark'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('settings') === 'Настройки' ? 'По умолчанию' : 'Default'}
              </p>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl transition-all"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(124,111,247,0.15)' : 'var(--bg-tertiary)',
              border: `2px solid ${theme === 'light' ? 'var(--accent-primary)' : 'transparent'}`,
              boxShadow: theme === 'light' ? 'var(--glow-primary)' : 'none',
            }}
          >
            <span className="text-2xl">☀️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('settings') === 'Настройки' ? 'Светлая' : 'Light'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('settings') === 'Настройки' ? 'Дневной режим' : 'Day mode'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Venue Logo */}
      <div className="mb-10 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('settings') === 'Настройки' ? 'Логотип' : 'Logo'}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
          {t('settings') === 'Настройки'
            ? 'Загрузите логотип, который будет отображаться на карте'
            : 'Upload a logo to display on the map'}
        </p>

        <div className="flex items-center gap-6">
          <div
            className="relative w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '2px dashed var(--surface)' }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Venue logo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-4xl opacity-50">🏠</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                opacity: uploadingLogo ? 0.5 : 1,
              }}
            >
              {uploadingLogo
                ? '...'
                : logoUrl
                  ? (t('settings') === 'Настройки' ? 'Заменить' : 'Replace')
                  : (t('settings') === 'Настройки' ? 'Загрузить' : 'Upload')}
            </button>
            {logoUrl && (
              <button
                onClick={handleLogoRemove}
                disabled={uploadingLogo}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--accent-error)', opacity: uploadingLogo ? 0.5 : 1 }}
              >
                {t('settings') === 'Настройки' ? 'Удалить' : 'Remove'}
              </button>
            )}
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              JPG, PNG, WebP · max 2 MB
            </p>
          </div>
        </div>
      </div>

      {/* Venue Settings */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>{tVenues('name')}</label>
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

        {/* Danger Zone */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Danger Zone
          </h3>
          <p className="text-gray-500 text-sm mb-4">{tVenues('deleteVenueHint')}</p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {tVenues('deleteVenue')}
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-300 text-sm mb-4">{tVenues('deleteVenueConfirm')}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {deleting ? '...' : tVenues('deleteVenue')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
