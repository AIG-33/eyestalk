'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ACTIVITY_EMOJI: Record<string, string> = {
  poll: '📊',
  contest: '🏆',
  tournament: '⚔️',
  challenge: '🎯',
  quest: '🗺️',
  auction: '💰',
};

interface PollOption {
  key: string;
  label: string;
}

interface VoteRow {
  option_key: string;
  tokens_spent: number;
  user_id: string;
  created_at: string;
}

interface LiveActivity {
  id: string;
  title: string;
  type: string;
  config: Record<string, unknown>;
  ends_at: string;
  participants: number;
  votes: VoteRow[];
}

interface LiveData {
  venueName: string;
  activeCount: number;
  activities: LiveActivity[];
}

export default function LiveScreenPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const [data, setData] = useState<LiveData | null>(null);
  const [time, setTime] = useState(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchLiveData = useCallback(async () => {
    const venueId = current?.id;
    const venueName = current?.name;
    if (!venueId || !venueName) return;

    const supabase = createClient();

    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('status', 'active');

    const { data: acts } = await supabase
      .from('activities')
      .select('id, title, type, config, ends_at')
      .eq('venue_id', venueId)
      .eq('status', 'active');

    const activities: LiveActivity[] = [];

    for (const a of acts || []) {
      const { count: pCount } = await supabase
        .from('activity_participants')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', a.id);

      const { data: votes } = await supabase
        .from('votes')
        .select('option_key, tokens_spent, user_id, created_at')
        .eq('activity_id', a.id)
        .order('tokens_spent', { ascending: false });

      activities.push({
        id: a.id,
        title: a.title,
        type: a.type,
        config: (a.config as Record<string, unknown>) || {},
        ends_at: a.ends_at,
        participants: pCount || 0,
        votes: (votes as VoteRow[]) || [],
      });
    }

    setData({ venueName, activeCount: count || 0, activities });
  }, [current?.id, current?.name]);

  useEffect(() => {
    if (!current?.id) {
      setData(null);
      return;
    }
    void fetchLiveData();
    const interval = setInterval(() => void fetchLiveData(), 15000);
    return () => clearInterval(interval);
  }, [current?.id, fetchLiveData]);

  useEffect(() => {
    const venueId = current?.id;
    if (!venueId) return;

    const supabase = createClient();

    const cleanup = () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
    cleanup();

    const votesChannel = supabase
      .channel(`live-votes:${venueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => void fetchLiveData(),
      )
      .subscribe();
    channelsRef.current.push(votesChannel);

    const activitiesChannel = supabase
      .channel(`live-activities:${venueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => void fetchLiveData(),
      )
      .subscribe();
    channelsRef.current.push(activitiesChannel);

    const participantsChannel = supabase
      .channel(`live-participants:${venueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_participants' },
        () => void fetchLiveData(),
      )
      .subscribe();
    channelsRef.current.push(participantsChannel);

    return cleanup;
  }, [current?.id, fetchLiveData]);

  if (!current?.id) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p className="text-gray-500 text-xl">No venue selected.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p className="text-gray-500 text-xl">Loading...</p>
      </div>
    );
  }

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const expanded = expandedId
    ? data.activities.find((a) => a.id === expandedId)
    : null;

  return (
    <div
      className="min-h-screen p-12 flex flex-col relative"
      style={{ background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            {data.venueName}
          </h1>
          <p className="text-violet-400 text-xl mt-1 font-light">EyesTalk</p>
        </div>
        <div className="text-right">
          <p className="text-6xl font-light text-white tabular-nums">
            {timeStr}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-8 mb-12">
        <div className="border border-gray-800 rounded-2xl p-8 flex-1" style={{ background: 'var(--glass-bg)' }}>
          <p className="text-gray-400 text-lg mb-2">{t('activeUsers')}</p>
          <p className="text-7xl font-black text-white">{data.activeCount}</p>
        </div>
        <div className="border border-gray-800 rounded-2xl p-8 flex-1" style={{ background: 'var(--glass-bg)' }}>
          <p className="text-gray-400 text-lg mb-2">{t('activeActivities')}</p>
          <p className="text-7xl font-black text-white">
            {data.activities.length}
          </p>
        </div>
      </div>

      {/* Activities with results */}
      {data.activities.length > 0 && (
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-5">
            {t('activities')}
          </h2>
          <div className="grid grid-cols-2 gap-5">
            {data.activities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                now={time}
                onExpand={() => setExpandedId(act.id)}
              />
            ))}
          </div>
        </div>
      )}

      {data.activities.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 text-xl">No active activities</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 flex items-center justify-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-500 text-lg">Live — realtime</span>
      </div>

      {/* Expanded detail modal */}
      {expanded && (
        <ActivityDetailModal
          activity={expanded}
          now={time}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

function ActivityCard({
  activity,
  now,
  onExpand,
}: {
  activity: LiveActivity;
  now: Date;
  onExpand: () => void;
}) {
  const timeLeft = getTimeLeft(activity.ends_at, now);

  return (
    <button
      onClick={onExpand}
      className="border border-gray-800 rounded-2xl p-6 text-left hover:border-violet-500/50 transition-colors cursor-pointer"
      style={{ background: 'var(--glass-bg)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {ACTIVITY_EMOJI[activity.type] || '🎯'}
          </span>
          <span className="text-xs text-violet-300 uppercase tracking-wider font-semibold">
            {activity.type.replace('_', ' ')}
          </span>
        </div>
        {timeLeft && (
          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full font-mono">
            {timeLeft}
          </span>
        )}
      </div>

      <p className="text-xl font-bold text-white mb-3">{activity.title}</p>

      <ActivityResultPreview activity={activity} />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {activity.participants} participant
          {activity.participants !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-violet-400 hover:text-violet-300">
          Details →
        </span>
      </div>
    </button>
  );
}

function ActivityResultPreview({ activity }: { activity: LiveActivity }) {
  if (activity.type === 'poll') {
    return <PollResultsCompact activity={activity} />;
  }
  if (activity.type === 'auction') {
    return <AuctionResultCompact activity={activity} />;
  }
  return (
    <p className="text-sm text-gray-500">
      {activity.votes.length} action{activity.votes.length !== 1 ? 's' : ''}
    </p>
  );
}

function PollResultsCompact({ activity }: { activity: LiveActivity }) {
  const options = (activity.config.options as PollOption[]) || [];
  const totalVotes = activity.votes.length;

  const counts: Record<string, number> = {};
  for (const v of activity.votes) {
    counts[v.option_key] = (counts[v.option_key] || 0) + 1;
  }

  const sorted = [...options].sort(
    (a, b) => (counts[b.key] || 0) - (counts[a.key] || 0),
  );
  const top3 = sorted.slice(0, 3);

  return (
    <div className="space-y-1.5">
      {top3.map((opt) => {
        const count = counts[opt.key] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return (
          <div key={opt.key} className="relative">
              <div className="flex items-center justify-between relative z-10 px-2 py-1">
              <span className="text-sm truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                {opt.label}
              </span>
              <span className="text-sm font-bold ml-2 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {pct}%
              </span>
            </div>
            <div
              className="absolute inset-0 rounded"
              style={{ width: `${pct}%`, background: 'var(--accent-primary)', opacity: 0.15 }}
            />
          </div>
        );
      })}
      <p className="text-xs text-gray-500 mt-1">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {options.length > 3 ? ` · ${options.length - 3} more options` : ''}
      </p>
    </div>
  );
}

function AuctionResultCompact({ activity }: { activity: LiveActivity }) {
  const bids = activity.votes.filter((v) => v.option_key === 'bid');
  const highestBid = bids.length > 0 ? bids[0].tokens_spent : 0;
  const startingPrice =
    (activity.config.starting_price as number) || 0;
  const itemName = (activity.config.item_name as string) || '';

  return (
    <div>
      {itemName && (
        <p className="text-sm text-amber-300 mb-1 font-medium">{itemName}</p>
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-amber-400 tabular-nums">
          {highestBid > 0 ? highestBid : startingPrice}
        </span>
        <span className="text-sm text-gray-500">🪙</span>
        <span className="text-xs text-gray-600 ml-auto">
          {bids.length} bid{bids.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function ActivityDetailModal({
  activity,
  now,
  onClose,
}: {
  activity: LiveActivity;
  now: Date;
  onClose: () => void;
}) {
  const timeLeft = getTimeLeft(activity.ends_at, now);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="border border-gray-700 rounded-3xl p-10 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">
                {ACTIVITY_EMOJI[activity.type] || '🎯'}
              </span>
              <span className="text-sm text-violet-300 uppercase tracking-wider font-semibold">
                {activity.type.replace('_', ' ')}
              </span>
              {timeLeft && (
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full font-mono">
                  {timeLeft}
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-white">{activity.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-2"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-gray-500 mb-6">
          {activity.participants} participant
          {activity.participants !== 1 ? 's' : ''} · {activity.votes.length}{' '}
          vote{activity.votes.length !== 1 ? 's' : ''}
        </div>

        {/* Results by type */}
        {activity.type === 'poll' && (
          <PollResultsFull activity={activity} />
        )}
        {activity.type === 'auction' && (
          <AuctionResultFull activity={activity} />
        )}
        {activity.type !== 'poll' && activity.type !== 'auction' && (
          <div className="text-gray-500 text-center py-8">
            <p className="text-4xl mb-4">🎯</p>
            <p>
              {activity.participants} participants active
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PollResultsFull({ activity }: { activity: LiveActivity }) {
  const question = (activity.config.question as string) || '';
  const options = (activity.config.options as PollOption[]) || [];
  const totalVotes = activity.votes.length;

  const counts: Record<string, number> = {};
  for (const v of activity.votes) {
    counts[v.option_key] = (counts[v.option_key] || 0) + 1;
  }

  const sorted = [...options].sort(
    (a, b) => (counts[b.key] || 0) - (counts[a.key] || 0),
  );

  return (
    <div>
      {question && (
        <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>{question}</p>
      )}
      <div className="space-y-3">
        {sorted.map((opt, i) => {
          const count = counts[opt.key] || 0;
          const pct =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isLeader = i === 0 && count > 0;
          return (
            <div
              key={opt.key}
              className={`relative rounded-xl overflow-hidden ${
                isLeader
                  ? 'border border-violet-500/40'
                  : 'border border-gray-800'
              }`}
            >
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  width: `${pct}%`,
                  background: isLeader ? 'var(--accent-primary)' : 'var(--surface)',
                  opacity: isLeader ? 0.2 : 0.5,
                }}
              />
              <div className="relative z-10 flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {isLeader && <span className="text-lg">👑</span>}
                  <span
                    className="text-base"
                    style={{
                      color: isLeader ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isLeader ? 700 : 400,
                    }}
                  >
                    {opt.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{count}</span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: isLeader ? 'var(--accent-light)' : 'var(--text-tertiary)' }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 mt-4 text-center">
        Total: {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function AuctionResultFull({ activity }: { activity: LiveActivity }) {
  const itemName = (activity.config.item_name as string) || '';
  const itemDescription = (activity.config.item_description as string) || '';
  const startingPrice = (activity.config.starting_price as number) || 0;
  const minIncrement = (activity.config.min_increment as number) || 1;

  const bids = activity.votes
    .filter((v) => v.option_key === 'bid')
    .sort((a, b) => b.tokens_spent - a.tokens_spent);

  const highestBid = bids.length > 0 ? bids[0].tokens_spent : 0;

  return (
    <div>
      {/* Item info */}
      <div className="rounded-xl p-5 mb-6 border border-gray-700/50" style={{ background: 'var(--glass-bg)' }}>
        {itemName && (
          <p className="text-lg text-amber-300 font-bold mb-1">{itemName}</p>
        )}
        {itemDescription && (
          <p className="text-sm text-gray-400">{itemDescription}</p>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>Start: {startingPrice} 🪙</span>
          <span>Step: +{minIncrement}</span>
        </div>
      </div>

      {/* Current highest */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
          {highestBid > 0 ? 'Highest bid' : 'Starting price'}
        </p>
        <p className="text-5xl font-black text-amber-400 tabular-nums">
          {highestBid > 0 ? highestBid : startingPrice} 🪙
        </p>
      </div>

      {/* Bid history */}
      {bids.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">
            Bid history ({bids.length})
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bids.map((bid, i) => (
              <div
                key={`${bid.user_id}-${bid.created_at}`}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                  i === 0
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : ''
                }`}
                style={i !== 0 ? { background: 'var(--glass-bg)' } : undefined}
              >
                <div className="flex items-center gap-2">
                  {i === 0 ? (
                    <span className="text-lg">👑</span>
                  ) : (
                    <span className="text-sm text-gray-600 w-6 text-center">
                      #{i + 1}
                    </span>
                  )}
                  <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {bid.user_id.slice(0, 8)}…
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      color: i === 0 ? 'var(--accent-warning)' : 'var(--text-primary)',
                      fontSize: i === 0 ? '1.125rem' : undefined,
                    }}
                  >
                    {bid.tokens_spent}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(bid.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {bids.length === 0 && (
        <p className="text-gray-600 text-center py-4">No bids yet</p>
      )}
    </div>
  );
}

function getTimeLeft(endDate: string, now: Date): string | null {
  const diff = new Date(endDate).getTime() - now.getTime();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
