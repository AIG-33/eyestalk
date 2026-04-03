'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';

export default function AnnouncementsPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    if (!current?.id) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/announcements?venue_id=${current.id}`);
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {
      setAnnouncements([]);
    }
    setLoading(false);
  }, [current?.id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSend = async () => {
    if (!text.trim() || !current?.id) return;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: current.id, content: text.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send');
      } else {
        setSuccess('Announcement sent!');
        setText('');
        setRemaining(data.announcements_remaining);
        fetchAnnouncements();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
    setSending(false);
  };

  if (!current?.id) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('announcements', { defaultValue: 'Announcements' })}
        </h1>
        <p style={{ color: 'var(--text-tertiary)' }}>No venue selected.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          📢 {t('announcements', { defaultValue: 'Announcements' })}
        </h1>
        <p style={{ color: 'var(--text-tertiary)' }} className="max-w-2xl">
          {t('announcementsHint', {
            defaultValue: 'Send announcements to all checked-in guests. They appear highlighted in the venue chat. Up to 5 per day.',
          })}
        </p>
      </div>

      {/* Send form */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('sendAnnouncement', { defaultValue: 'New Announcement' })}
        </h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('announcementPlaceholder', {
            defaultValue: 'e.g. Happy hour! 2 cocktails for the price of 1 until 10pm 🍹',
          })}
          rows={3}
          maxLength={500}
          className="w-full resize-none text-sm rounded-xl px-4 py-3 mb-4 focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)' }}
            >
              {sending ? '...' : t('send', { defaultValue: '📢 Send' })}
            </button>
            {remaining !== null && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {remaining} {t('remaining', { defaultValue: 'remaining today' })}
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {text.length}/500
          </span>
        </div>

        {error && (
          <p className="mt-3 text-sm" style={{ color: 'var(--accent-error)' }}>{error}</p>
        )}
        {success && (
          <p className="mt-3 text-sm" style={{ color: 'var(--accent-success)' }}>{success}</p>
        )}
      </div>

      {/* History */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('recentAnnouncements', { defaultValue: 'Recent' })}
        </h3>

        {loading ? (
          <p style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        ) : announcements.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-4xl mb-4">📢</p>
            <p className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('noAnnouncements', { defaultValue: 'No announcements yet' })}
            </p>
            <p className="max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              {t('noAnnouncementsHint', {
                defaultValue: 'Send your first announcement to let guests know about specials, events, or promotions.',
              })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div
                key={a.id}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255,183,77,0.06)',
                  border: '1px solid rgba(255,183,77,0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>📢</span>
                  <span className="text-xs font-bold" style={{ color: '#FFB74D' }}>
                    {current.name}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
