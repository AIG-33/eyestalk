'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useVenue } from '@/components/dashboard/venue-context';

interface TopGuest {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  checkin_count: number;
  last_visit: string;
  loyalty_tier: string | null;
}

interface LoyaltyTier {
  id: string;
  name: string;
  min_checkins: number;
  token_reward: number;
}

export default function LoyaltyPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const [guests, setGuests] = useState<TopGuest[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [totalUnique, setTotalUnique] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newMin, setNewMin] = useState('');
  const [newReward, setNewReward] = useState('');
  const [saving, setSaving] = useState(false);
  const [tierError, setTierError] = useState('');

  const fetchData = useCallback(async () => {
    if (!current?.id) {
      setGuests([]);
      setTiers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/venue-admin/${current.id}/top-guests`);
      const data = await res.json();
      setGuests(data.guests || []);
      setTiers(data.loyalty_tiers || []);
      setTotalUnique(data.total_unique_guests || 0);
    } catch {
      setGuests([]);
    }
    setLoading(false);
  }, [current?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTier = async () => {
    if (!newName.trim() || !newMin || !current?.id) return;
    setSaving(true);
    setTierError('');
    try {
      const res = await fetch(`/api/v1/venue-admin/${current.id}/loyalty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          min_checkins: parseInt(newMin, 10),
          token_reward: parseInt(newReward || '0', 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTierError(data.error || 'Failed');
      } else {
        setNewName('');
        setNewMin('');
        setNewReward('');
        fetchData();
      }
    } catch (e: any) {
      setTierError(e.message);
    }
    setSaving(false);
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!current?.id) return;
    await fetch(`/api/v1/venue-admin/${current.id}/loyalty?tier_id=${tierId}`, {
      method: 'DELETE',
    });
    fetchData();
  };

  if (!current?.id) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('loyalty', { defaultValue: 'Loyalty & Top Guests' })}
        </h1>
        <p style={{ color: 'var(--text-tertiary)' }}>No venue selected.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          🏆 {t('loyalty', { defaultValue: 'Loyalty & Top Guests' })}
        </h1>
        <p style={{ color: 'var(--text-tertiary)' }} className="max-w-2xl">
          {t('loyaltyHint', {
            defaultValue: 'See your most frequent visitors, create loyalty tiers, and reward regulars with tokens.',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Unique Guests" value={totalUnique} hint="All-time" loading={loading} />
        <StatCard label="Top Guest Visits" value={guests[0]?.checkin_count || 0} hint={guests[0]?.nickname || '—'} loading={loading} />
        <StatCard label="Loyalty Tiers" value={tiers.length} hint="Configured" loading={loading} />
      </div>

      {/* Loyalty Tiers */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('loyaltyTiers', { defaultValue: 'Loyalty Tiers' })}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {t('loyaltyTiersHint', {
            defaultValue: 'Define tiers based on check-in count. Guests reaching a tier earn bonus tokens automatically.',
          })}
        </p>

        {tiers.length > 0 && (
          <div className="space-y-2 mb-6">
            {tiers.map((tier) => (
              <div key={tier.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="text-lg">⭐</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tier.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {tier.min_checkins}+ check-ins · +{tier.token_reward} tokens
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTier(tier.id)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ color: 'var(--accent-error)' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Regular"
              className="text-sm rounded-lg px-3 py-2 w-40 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Min Check-ins</label>
            <input
              value={newMin}
              onChange={(e) => setNewMin(e.target.value)}
              type="number"
              min="1"
              placeholder="e.g. 5"
              className="text-sm rounded-lg px-3 py-2 w-28 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Token Reward</label>
            <input
              value={newReward}
              onChange={(e) => setNewReward(e.target.value)}
              type="number"
              min="0"
              placeholder="0"
              className="text-sm rounded-lg px-3 py-2 w-28 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <button
            onClick={handleAddTier}
            disabled={!newName.trim() || !newMin || saving}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)' }}
          >
            {saving ? '...' : 'Add Tier'}
          </button>
        </div>
        {tierError && <p className="mt-2 text-sm" style={{ color: 'var(--accent-error)' }}>{tierError}</p>}
      </div>

      {/* Top Guests */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('topGuests', { defaultValue: 'Top Guests' })}
        </h3>

        {loading ? (
          <p style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        ) : guests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No guests yet</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Guests will appear here as they check in to your venue.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {guests.map((guest, idx) => (
              <div key={guest.user_id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="text-lg font-bold w-6 text-center" style={{
                  color: idx < 3 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                }}>
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(124,111,247,0.15)' }}
                >
                  {guest.avatar_url ? (
                    <img src={guest.avatar_url} alt="" className="w-8 h-8 object-cover" />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {guest.nickname.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {guest.nickname}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Last: {new Date(guest.last_visit).toLocaleDateString()}
                  </p>
                </div>
                {guest.loyalty_tier && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'rgba(124,111,247,0.15)', color: 'var(--accent-light)' }}
                  >
                    ⭐ {guest.loyalty_tier}
                  </span>
                )}
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {guest.checkin_count}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>visits</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, loading }: { label: string; value: number; hint: string; loading: boolean }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {loading ? '…' : value}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
    </div>
  );
}
