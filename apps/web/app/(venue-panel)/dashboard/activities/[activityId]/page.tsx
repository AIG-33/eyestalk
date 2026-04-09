'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';
import { Breadcrumbs } from '@/components/dashboard/breadcrumbs';

type PollOption = { key: string; label: string };

type ActivityConfig = {
  question?: string;
  options?: PollOption[];
  item_name?: string;
  starting_price?: number;
  min_increment?: number;
  [k: string]: unknown;
};

type Activity = {
  id: string;
  venue_id: string;
  type: string;
  title: string;
  description: string | null;
  config: ActivityConfig;
  status: string;
  token_cost: number;
  starts_at: string;
  ends_at: string;
};

type VoteRow = {
  id: string;
  user_id: string;
  option_key: string;
  tokens_spent: number;
  created_at: string;
};

type ParticipantRow = {
  id: string;
  user_id: string;
  joined_at: string;
  score: number | null;
};

const EMOJI: Record<string, string> = {
  poll: '📊',
  event: '🎉',
  auction: '💰',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function ActivityDetailPage() {
  const params = useParams();
  const activityId = params.activityId as string;
  const { current } = useVenue();
  const t = useTranslations('dashboard');

  const [activity, setActivity] = useState<Activity | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!current?.id || !activityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: act, error: actErr } = await supabase
      .from('activities')
      .select('id, venue_id, type, title, description, config, status, token_cost, starts_at, ends_at')
      .eq('id', activityId)
      .single();

    if (actErr || !act) {
      setError('notFound');
      setActivity(null);
      setLoading(false);
      return;
    }

    if (act.venue_id !== current.id) {
      setError('wrongVenue');
      setActivity(null);
      setLoading(false);
      return;
    }

    setActivity(act as Activity);

    const [{ data: vData }, { data: pData }] = await Promise.all([
      supabase
        .from('votes')
        .select('id, user_id, option_key, tokens_spent, created_at')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_participants')
        .select('id, user_id, joined_at, score')
        .eq('activity_id', activityId)
        .order('joined_at', { ascending: false }),
    ]);

    const vList = (vData || []) as VoteRow[];
    const pList = (pData || []) as ParticipantRow[];
    setVotes(vList);
    setParticipants(pList);

    const userIds = [
      ...new Set([
        ...vList.map((x) => x.user_id),
        ...pList.map((x) => x.user_id),
      ]),
    ];

    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: { id: string; nickname: string }) => {
        map[p.id] = p.nickname;
      });
      setNicknames(map);
    } else {
      setNicknames({});
    }

    setLoading(false);
  }, [activityId, current?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const pollStats = useMemo(() => {
    if (!activity || activity.type !== 'poll') return null;
    const options = (activity.config?.options as PollOption[]) || [];
    const counts: Record<string, number> = {};
    for (const v of votes) {
      counts[v.option_key] = (counts[v.option_key] || 0) + 1;
    }
    const total = votes.length;
    return { options, counts, total };
  }, [activity, votes]);

  const auctionBids = useMemo(() => {
    if (!activity || activity.type !== 'auction') return [];
    return votes
      .filter((v) => v.option_key === 'bid')
      .sort((a, b) => b.tokens_spent - a.tokens_spent);
  }, [activity, votes]);

  const now = Date.now();
  const endsAt = activity ? new Date(activity.ends_at).getTime() : 0;
  const isLive = activity?.status === 'active' && endsAt > now;

  if (!current?.id) {
    return (
      <div className="p-8">
        <p className="text-gray-400">No venue selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl space-y-6">
        <Breadcrumbs items={[
          { label: t('title'), href: '/dashboard' },
          { label: t('activities'), href: '/dashboard/activities' },
          { label: '...' },
        ]} />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-2/3" />
          <div className="bg-gray-900/80 rounded-xl p-5 border border-gray-800">
            <div className="h-4 bg-gray-800 rounded w-1/4 mb-4" />
            <div className="flex gap-6">
              <div className="h-10 bg-gray-800 rounded w-20" />
              <div className="h-10 bg-gray-800 rounded w-20" />
            </div>
          </div>
          <div className="bg-gray-900/80 rounded-xl p-5 border border-gray-800">
            <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
            <div className="h-[200px] bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error === 'notFound' || !activity) {
    return (
      <div className="p-8">
        <Breadcrumbs items={[
          { label: t('title'), href: '/dashboard' },
          { label: t('activities'), href: '/dashboard/activities' },
          { label: t('activityNotFound') },
        ]} />
        <p className="text-gray-400">{t('activityNotFound')}</p>
      </div>
    );
  }

  if (error === 'wrongVenue') {
    return (
      <div className="p-8">
        <Breadcrumbs items={[
          { label: t('title'), href: '/dashboard' },
          { label: t('activities'), href: '/dashboard/activities' },
          { label: t('activityWrongVenue') },
        ]} />
        <p className="text-gray-400">{t('activityWrongVenue')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <Breadcrumbs items={[
        { label: t('title'), href: '/dashboard' },
        { label: t('activities'), href: '/dashboard/activities' },
        { label: activity.title },
      ]} />

      <div className="flex flex-wrap items-start gap-4 mb-8">
        <span className="text-4xl">{EMOJI[activity.type] || '🎯'}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white mb-1">{activity.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="capitalize">{activity.type}</span>
            <span>·</span>
            <span>{formatRange(activity.starts_at, activity.ends_at)}</span>
            {activity.token_cost > 0 && (
              <>
                <span>·</span>
                <span>{activity.token_cost} tokens</span>
              </>
            )}
          </div>
          {activity.description && (
            <p className="text-gray-400 mt-2 text-sm">{activity.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[activity.status] || ''}`}>
            {activity.status}
          </span>
          <span className={`text-xs font-medium ${isLive ? 'text-green-400' : 'text-gray-500'}`}>
            {isLive ? t('activityLiveProgress') : t('activityResultsSnapshot')}
          </span>
        </div>
      </div>

      {/* Participation summary */}
      <section className="bg-gray-900/80 rounded-xl border border-gray-800 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          {t('activityParticipation')}
        </h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-2xl font-bold text-white">{participants.length}</p>
            <p className="text-xs text-gray-500">{t('activityJoinedCount')}</p>
          </div>
          {activity.type === 'poll' && pollStats && (
            <div>
              <p className="text-2xl font-bold text-white">{pollStats.total}</p>
              <p className="text-xs text-gray-500">{t('activityVotesCast')}</p>
            </div>
          )}
          {activity.type === 'auction' && (
            <div>
              <p className="text-2xl font-bold text-white">{auctionBids.length}</p>
              <p className="text-xs text-gray-500">{t('activityBidsPlaced')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Poll */}
      {activity.type === 'poll' && pollStats && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t('activityPollResults')}</h2>
          {pollStats.options.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('activityNoPollOptions')}</p>
          ) : (
            <div className="space-y-4">
              {activity.config?.question && (
                <p className="text-gray-300 text-sm font-medium">{activity.config.question as string}</p>
              )}
              {pollStats.options.map((opt) => {
                const c = pollStats.counts[opt.key] || 0;
                const pct = pollStats.total > 0 ? Math.round((c / pollStats.total) * 100) : 0;
                return (
                  <div key={opt.key} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">{opt.label || opt.key}</span>
                      <span className="text-violet-300">
                        {c} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {votes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">{t('activityRecentVotes')}</h3>
              <div className="rounded-xl border border-gray-800 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/80 text-gray-400 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('activityColGuest')}</th>
                      <th className="px-3 py-2 font-medium">{t('activityColChoice')}</th>
                      <th className="px-3 py-2 font-medium">{t('activityColTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.slice(0, 50).map((v) => {
                      const label =
                        pollStats.options.find((o) => o.key === v.option_key)?.label || v.option_key;
                      return (
                        <tr key={v.id} className="border-t border-gray-800 text-gray-300">
                          <td className="px-3 py-2">{nicknames[v.user_id] || '—'}</td>
                          <td className="px-3 py-2 text-violet-300">{label}</td>
                          <td className="px-3 py-2 text-gray-500">{formatTime(v.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Auction */}
      {activity.type === 'auction' && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t('activityAuctionBids')}</h2>
          {auctionBids.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('activityNoBidsYet')}</p>
          ) : (
            <>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-amber-200/80 uppercase tracking-wide mb-1">{t('activityHighestBid')}</p>
                <p className="text-2xl font-bold text-amber-300">
                  {auctionBids[0].tokens_spent} <span className="text-lg font-normal">tokens</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {nicknames[auctionBids[0].user_id] || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/80 text-gray-400 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">{t('activityColGuest')}</th>
                      <th className="px-3 py-2 font-medium">{t('activityColAmount')}</th>
                      <th className="px-3 py-2 font-medium">{t('activityColTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auctionBids.map((b, i) => (
                      <tr key={b.id} className="border-t border-gray-800 text-gray-300">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2">{nicknames[b.user_id] || '—'}</td>
                        <td className="px-3 py-2 text-amber-300 font-medium">{b.tokens_spent}</td>
                        <td className="px-3 py-2 text-gray-500">{formatTime(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* Event */}
      {activity.type === 'event' && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t('activityAttendees')}</h2>
          {participants.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('activityNoParticipantsYet')}</p>
          ) : (
            <div className="rounded-xl border border-gray-800 overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/80 text-gray-400 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t('activityColGuest')}</th>
                    <th className="px-3 py-2 font-medium">{t('activityColJoined')}</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-t border-gray-800 text-gray-300">
                      <td className="px-3 py-2">{nicknames[p.user_id] || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{formatTime(p.joined_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Other activity types: show attendees + any vote rows */}
      {activity.type !== 'poll' && activity.type !== 'auction' && activity.type !== 'event' && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t('activityAttendees')}</h2>
          {participants.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('activityNoParticipantsYet')}</p>
          ) : (
            <div className="rounded-xl border border-gray-800 overflow-hidden max-h-64 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/80 text-gray-400 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t('activityColGuest')}</th>
                    <th className="px-3 py-2 font-medium">{t('activityColJoined')}</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-t border-gray-800 text-gray-300">
                      <td className="px-3 py-2">{nicknames[p.user_id] || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{formatTime(p.joined_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {votes.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-400 mb-2">{t('activityRecentVotes')}</h3>
              <div className="rounded-xl border border-gray-800 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/80 text-gray-400 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('activityColGuest')}</th>
                      <th className="px-3 py-2 font-medium">{t('activityColChoice')}</th>
                      <th className="px-3 py-2 font-medium">{t('activityColTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.slice(0, 40).map((v) => (
                      <tr key={v.id} className="border-t border-gray-800 text-gray-300">
                        <td className="px-3 py-2">{nicknames[v.user_id] || '—'}</td>
                        <td className="px-3 py-2 text-violet-300">{v.option_key}</td>
                        <td className="px-3 py-2 text-gray-500">{formatTime(v.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleString()} → ${e.toLocaleString()}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
