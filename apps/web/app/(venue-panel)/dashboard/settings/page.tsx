'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { VENUE_TYPES, CHECKIN_METHODS, DEFAULT_CHECKIN_METHODS, type CheckinMethod } from '@eyestalk/shared/constants';
import { useVenue } from '@/components/dashboard/venue-context';
import { useTheme } from '@/components/dashboard/theme-context';
import { useToast } from '@/components/dashboard/toast';

const CHECKIN_METHOD_META: Record<CheckinMethod, { emoji: string; label: string; hint: string }> = {
  qr: { emoji: '📷', label: 'QR code', hint: 'Guests scan your venue QR' },
  geofence: { emoji: '📍', label: 'Location', hint: 'Check in when nearby' },
  code: { emoji: '🔑', label: 'Code', hint: 'Guests type a code you set' },
};

export default function SettingsPage() {
  const t = useTranslations('dashboard');
  const tVenues = useTranslations('venues');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { current, removeVenue, updateVenue } = useVenue();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
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
    checkin_methods: DEFAULT_CHECKIN_METHODS as CheckinMethod[],
    checkin_code: '',
    wifi_ssid: '',
    wifi_password: '',
  });

  const loadVenue = useCallback(async () => {
    const venueId = current?.id;
    if (!venueId) {
      setVenue(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const [{ data }, { data: secret }] = await Promise.all([
      supabase.from('venues').select('*').eq('id', venueId).maybeSingle(),
      supabase
        .from('venue_secrets')
        .select('checkin_code, wifi_password')
        .eq('venue_id', venueId)
        .maybeSingle(),
    ]);

    if (data) {
      setVenue(data);
      setLogoUrl(data.logo_url || null);
      setForm({
        name: data.name,
        type: data.type,
        description: data.description || '',
        address: data.address,
        geofence_radius: data.geofence_radius,
        checkin_methods:
          Array.isArray(data.checkin_methods) && data.checkin_methods.length > 0
            ? (data.checkin_methods as CheckinMethod[])
            : DEFAULT_CHECKIN_METHODS,
        checkin_code: secret?.checkin_code || '',
        wifi_ssid: data.wifi_ssid || '',
        wifi_password: secret?.wifi_password || '',
      });
    } else {
      setVenue(null);
    }
    setLoading(false);
  }, [current?.id]);

  const toggleMethod = (method: CheckinMethod) => {
    setForm((prev) => {
      const has = prev.checkin_methods.includes(method);
      // Keep at least one method enabled.
      if (has && prev.checkin_methods.length === 1) return prev;
      const next = has
        ? prev.checkin_methods.filter((m) => m !== method)
        : [...prev.checkin_methods, method];
      return { ...prev, checkin_methods: next };
    });
  };

  useEffect(() => {
    setLoading(true);
    void loadVenue();
  }, [loadVenue]);

  const handleSave = async () => {
    if (!venue) return;

    if (form.checkin_methods.includes('code') && !form.checkin_code.trim()) {
      toast('Set a check-in code or disable the code method', 'error');
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from('venues')
      .update({
        name: form.name,
        type: form.type,
        description: form.description || null,
        address: form.address,
        geofence_radius: form.geofence_radius,
        checkin_methods: form.checkin_methods,
        wifi_ssid: form.wifi_ssid.trim() || null,
      })
      .eq('id', venue.id);

    if (error) {
      toast(error.message, 'error');
      setSaving(false);
      return;
    }

    // Secrets (check-in code + WiFi password) live in a separate, owner-only table.
    const { error: secretError } = await supabase.from('venue_secrets').upsert(
      {
        venue_id: venue.id,
        checkin_code: form.checkin_code.trim() || null,
        wifi_password: form.wifi_password.trim() || null,
      },
      { onConflict: 'venue_id' },
    );

    if (secretError) {
      toast(secretError.message, 'error');
    } else {
      updateVenue(venue.id, { name: form.name, logo_url: logoUrl });
      toast('Settings saved', 'success');
    }
    setSaving(false);
  };

  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venue) return;

    setUploadingLogo(true);
    setLogoError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/v1/venue-admin/${venue.id}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLogoUrl(data.logo_url);
      updateVenue(venue.id, { logo_url: data.logo_url });
      toast('Logo uploaded', 'success');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setLogoError(err.message || 'Upload failed');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!venue) return;
    setUploadingLogo(true);
    setLogoError(null);

    try {
      const res = await fetch(`/api/v1/venue-admin/${venue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_logo' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Remove failed');
      }

      setLogoUrl(null);
      updateVenue(venue.id, { logo_url: null });
      toast('Logo removed', 'success');
    } catch (err: any) {
      console.error('Logo remove error:', err);
      setLogoError(err.message || 'Remove failed');
    } finally {
      setUploadingLogo(false);
    }
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
      toast('Failed to delete venue', 'error');
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
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('settings')}</h1>
      <p style={{ color: 'var(--text-tertiary)' }} className="mb-6">{t('settingsHint')}</p>

      {/* Theme Toggle */}
      <div className="mb-10 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('themeTitle')}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
          {t('themeHint')}
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
                {t('themeDark')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('themeDarkHint')}
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
                {t('themeLight')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('themeLightHint')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Venue Logo */}
      <div className="mb-10 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('logoTitle')}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
          {t('logoHint')}
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
                  ? t('logoReplace')
                  : t('logoUpload')}
            </button>
            {logoUrl && (
              <button
                onClick={handleLogoRemove}
                disabled={uploadingLogo}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--accent-error)', opacity: uploadingLogo ? 0.5 : 1 }}
              >
                {t('logoRemove')}
              </button>
            )}
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {t('logoSpec')}
            </p>
            {logoError && (
              <p className="text-xs font-medium" style={{ color: 'var(--accent-error, #ef4444)' }}>
                {logoError}
              </p>
            )}
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

        {/* Check-in methods */}
        <div className="pt-2">
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Check-in methods
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Choose how guests can check in. At least one method must stay enabled.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CHECKIN_METHODS.map((method) => {
              const active = form.checkin_methods.includes(method);
              const meta = CHECKIN_METHOD_META[method];
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => toggleMethod(method)}
                  className="text-left px-4 py-3 rounded-xl transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(124,111,247,0.15)' : 'var(--bg-tertiary)',
                    border: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
                  }}
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                    {meta.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {meta.hint}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Check-in code (only when the code method is enabled) */}
        {form.checkin_methods.includes('code') && (
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Check-in code</label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Guests type this code to check in. Display it at the entrance or on tables.
            </p>
            <input
              type="text"
              value={form.checkin_code}
              maxLength={50}
              onChange={(e) => setForm({ ...form, checkin_code: e.target.value })}
              placeholder="e.g. CLOUD9"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white uppercase tracking-wider focus:outline-none focus:border-violet-500"
            />
          </div>
        )}

        {/* WiFi */}
        <div className="pt-2">
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            WiFi
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            The password is only revealed to guests after they check in.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.wifi_ssid}
              maxLength={100}
              onChange={(e) => setForm({ ...form, wifi_ssid: e.target.value })}
              placeholder="Network name (SSID)"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
            />
            <input
              type="text"
              value={form.wifi_password}
              maxLength={200}
              onChange={(e) => setForm({ ...form, wifi_password: e.target.value })}
              placeholder="WiFi password"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {saving ? '...' : tCommon('save')}
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
