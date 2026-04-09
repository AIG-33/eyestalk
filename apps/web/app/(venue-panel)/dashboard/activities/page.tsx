'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { ACTIVITY_TYPES } from '@eyestalk/shared/constants';
import { useVenue } from '@/components/dashboard/venue-context';
import { useToast } from '@/components/dashboard/toast';

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-4 h-4 rounded-full bg-gray-700 hover:bg-violet-600/50 text-gray-400 hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors shrink-0"
      >
        ?
        {open && (
          <div className="absolute left-6 bottom-0 z-50 w-64 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl text-left">
            <p className="text-xs text-gray-300 font-normal leading-relaxed">{hint}</p>
          </div>
        )}
      </button>
    </div>
  );
}

type PollOption = { key: string; label: string };

type AuctionConfig = {
  item_name: string;
  item_description?: string;
  starting_price: number;
  min_increment: number;
};

type ActivityConfig = {
  question?: string;
  options?: PollOption[];
  item_name?: string;
  item_description?: string;
  starting_price?: number;
  min_increment?: number;
  [k: string]: unknown;
};

type Activity = {
  id: string;
  venue_id: string;
  zone_id: string | null;
  created_by: string;
  type: string;
  title: string;
  description: string | null;
  config: ActivityConfig;
  status: string;
  max_participants: number | null;
  token_cost: number;
  starts_at: string;
  ends_at: string;
  created_at: string;
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

type StatusFilter = 'all' | 'draft' | 'active' | 'completed' | 'cancelled';

export default function ActivitiesPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const PAGE_SIZE = 20;
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadActivities = useCallback(async () => {
    const venueId = current?.id;
    if (!venueId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
      supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', venueId),
    ]);

    const list = (data as Activity[]) || [];
    setActivities(list);
    setTotalCount(count || 0);
    setHasMore(list.length >= PAGE_SIZE);
    setLoading(false);
  }, [current?.id]);

  const loadMore = async () => {
    const venueId = current?.id;
    if (!venueId || !hasMore) return;
    setLoadingMore(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
      .range(activities.length, activities.length + PAGE_SIZE - 1);
    const more = (data as Activity[]) || [];
    setActivities((prev) => [...prev, ...more]);
    setHasMore(more.length >= PAGE_SIZE);
    setLoadingMore(false);
  };

  useEffect(() => {
    setLoading(true);
    void loadActivities();
  }, [loadActivities]);

  const createActivity = async (form: {
    title: string;
    type: string;
    description: string;
    config: ActivityConfig;
    starts_at: string;
    ends_at: string;
    max_participants: string;
    token_cost: string;
  }) => {
    const venueId = current?.id;
    if (!venueId) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('activities').insert({
      venue_id: venueId,
      created_by: user.id,
      title: form.title,
      type: form.type,
      description: form.description || null,
      config: form.config,
      status: 'active',
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      token_cost: form.token_cost ? parseInt(form.token_cost) : 0,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
    });

    if (error) {
      toast('Failed to create activity', 'error');
      return;
    }
    toast('Activity created', 'success');
    setShowCreate(false);
    loadActivities();
  };

  const updateActivity = async (
    id: string,
    updates: Record<string, unknown>,
  ) => {
    const res = await fetch(`/api/v1/activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      toast('Activity updated', 'success');
      setEditingId(null);
      loadActivities();
    } else {
      toast('Failed to update activity', 'error');
    }
  };

  const deleteActivity = async (id: string) => {
    const res = await fetch(`/api/v1/activities/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Activity deleted', 'success');
      setDeletingId(null);
      loadActivities();
    } else {
      toast('Failed to delete activity', 'error');
    }
  };

  const toggleStatus = async (activity: Activity) => {
    setTogglingId(activity.id);
    const newStatus = activity.status === 'active' ? 'draft' : 'active';
    await updateActivity(activity.id, { status: newStatus });
    setTogglingId(null);
  };

  const filteredActivities =
    statusFilter === 'all'
      ? activities
      : activities.filter((a) => a.status === statusFilter);

  if (!current?.id) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">{t('activities')}</h1>
        <p className="text-gray-400">No venue selected.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('activities')}</h1>
          <p className="text-gray-400 text-sm">{t('activitiesHint')}</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setEditingId(null);
          }}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showCreate ? 'Cancel' : '+ Create Activity'}
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'draft', 'completed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === s
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s === 'all' ? `All (${activities.length})` : `${s} (${activities.filter((a) => a.status === s).length})`}
          </button>
        ))}
      </div>

      {showCreate && <CreateActivityForm onSubmit={createActivity} onCancel={() => setShowCreate(false)} />}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-800 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-gray-800 rounded-full" />
                <div className="w-11 h-6 bg-gray-800 rounded-full" />
                <div className="h-8 w-20 bg-gray-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <p className="text-gray-400">
            {statusFilter === 'all' ? 'No activities created yet' : `No ${statusFilter} activities`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((act) => (
            <div key={act.id}>
              {editingId === act.id ? (
                <EditActivityForm
                  activity={act}
                  onSave={(updates) => updateActivity(act.id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{EMOJI[act.type] || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{act.title}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="capitalize">{act.type}</span>
                        <span>·</span>
                        <span>{formatDate(act.starts_at)}</span>
                        {act.max_participants && (
                          <>
                            <span>·</span>
                            <span>Max {act.max_participants}</span>
                          </>
                        )}
                        {act.token_cost > 0 && (
                          <>
                            <span>·</span>
                            <span>{act.token_cost} tokens</span>
                          </>
                        )}
                      </div>
                      {act.description && (
                        <p className="text-gray-500 text-sm mt-1 truncate">{act.description}</p>
                      )}
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[act.status] || ''}`}
                    >
                      {act.status}
                    </span>

                    {/* Toggle active/draft */}
                    <button
                      onClick={() => toggleStatus(act)}
                      disabled={togglingId === act.id || act.status === 'completed' || act.status === 'cancelled'}
                      title={act.status === 'active' ? 'Deactivate' : 'Activate'}
                      className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        act.status === 'active' ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          act.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <Link
                      href={`/dashboard/activities/${act.id}`}
                      className="text-violet-400 hover:text-violet-300 text-sm font-medium px-3 py-1.5 rounded-lg border border-violet-500/40 hover:bg-violet-500/10 whitespace-nowrap transition-colors"
                    >
                      {t('activityViewDetails')}
                    </Link>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingId(act.id);
                        setShowCreate(false);
                      }}
                      className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-800 rounded-lg"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingId(act.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1.5 hover:bg-gray-800 rounded-lg"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Poll options preview */}
                  {act.type === 'poll' && act.config?.options && Array.isArray(act.config.options) && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      {act.config.question && (
                        <p className="text-gray-300 text-sm font-medium mb-2">{act.config.question as string}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(act.config.options as PollOption[]).map((opt) => (
                          <span
                            key={opt.key}
                            className="bg-violet-500/10 text-violet-300 text-xs px-3 py-1.5 rounded-lg border border-violet-500/20"
                          >
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auction preview */}
                  {act.type === 'auction' && act.config?.item_name && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-amber-500/10 text-amber-300 text-xs px-3 py-1.5 rounded-lg border border-amber-500/20">
                          {act.config.item_name as string}
                        </span>
                        <span className="text-gray-500 text-xs">
                          Start: {act.config.starting_price as number} tokens
                        </span>
                        <span className="text-gray-500 text-xs">
                          Step: +{act.config.min_increment as number}
                        </span>
                      </div>
                      {act.config.item_description && (
                        <p className="text-gray-500 text-xs mt-1.5 truncate">
                          {act.config.item_description as string}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {deletingId === act.id && (
                    <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-3">
                      <p className="text-sm text-red-400 flex-1">
                        Are you sure you want to delete &ldquo;{act.title}&rdquo;? This action cannot be undone.
                      </p>
                      <button
                        onClick={() => deleteActivity(act.id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                {loadingMore ? '...' : `Load more (${activities.length} of ${totalCount})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// ─── Poll Options Editor ─────────────────────────────────────────────

function PollOptionsEditor({
  question,
  onQuestionChange,
  options,
  onOptionsChange,
}: {
  question: string;
  onQuestionChange: (q: string) => void;
  options: PollOption[];
  onOptionsChange: (opts: PollOption[]) => void;
}) {
  const addOption = () => {
    const nextIdx = options.length + 1;
    onOptionsChange([...options, { key: `opt_${nextIdx}_${Date.now()}`, label: '' }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    onOptionsChange(options.filter((_, i) => i !== idx));
  };

  const updateLabel = (idx: number, label: string) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], label };
    onOptionsChange(updated);
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-violet-500/20 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📊</span>
        <span className="text-sm font-semibold text-violet-300">Poll Configuration</span>
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Question</label>
        <input
          type="text"
          placeholder="e.g. What song should we play next?"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-2 block">
          Answer options (min 2)
        </label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.key} className="flex items-center gap-2">
              <span className="text-gray-500 text-sm w-6 text-right shrink-0">{idx + 1}.</span>
              <input
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt.label}
                onChange={(e) => updateLabel(idx, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                disabled={options.length <= 2}
                className="text-gray-500 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-1"
                title="Remove option"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add option
          </button>
        )}
      </div>
    </div>
  );
}

function getDefaultPollOptions(): PollOption[] {
  return [
    { key: `opt_1_${Date.now()}`, label: '' },
    { key: `opt_2_${Date.now() + 1}`, label: '' },
  ];
}

function isPollValid(question: string, options: PollOption[]): boolean {
  const filledOptions = options.filter((o) => o.label.trim().length > 0);
  return question.trim().length > 0 && filledOptions.length >= 2;
}

// ─── Auction Config Editor ────────────────────────────────────────────

function AuctionConfigEditor({
  config,
  onChange,
}: {
  config: AuctionConfig;
  onChange: (c: AuctionConfig) => void;
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-amber-500/20 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">💰</span>
        <span className="text-sm font-semibold text-amber-300">Auction Configuration</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-sm text-gray-400 mb-1 block">Auction item name</label>
          <input
            type="text"
            placeholder="e.g. VIP Table for tonight"
            value={config.item_name}
            onChange={(e) => onChange({ ...config, item_name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-400 mb-1 block">Item description (optional)</label>
          <textarea
            placeholder="Describe what the winner gets..."
            value={config.item_description || ''}
            onChange={(e) => onChange({ ...config, item_description: e.target.value })}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Starting price (tokens)</label>
          <input
            type="number"
            placeholder="100"
            value={config.starting_price || ''}
            onChange={(e) => onChange({ ...config, starting_price: parseInt(e.target.value) || 0 })}
            min={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Min bid increment (tokens)</label>
          <input
            type="number"
            placeholder="10"
            value={config.min_increment || ''}
            onChange={(e) => onChange({ ...config, min_increment: parseInt(e.target.value) || 0 })}
            min={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}

function getDefaultAuctionConfig(): AuctionConfig {
  return { item_name: '', starting_price: 100, min_increment: 10 };
}

function isAuctionValid(config: AuctionConfig): boolean {
  return (
    config.item_name.trim().length > 0 &&
    config.starting_price >= 1 &&
    config.min_increment >= 1
  );
}

// ─── Create Activity Form ────────────────────────────────────────────

function CreateActivityForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: {
    title: string;
    type: string;
    description: string;
    config: ActivityConfig;
    starts_at: string;
    ends_at: string;
    max_participants: string;
    token_cost: string;
  }) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('dashboard');
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('poll');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState(toLocalDatetime(now.toISOString()));
  const [endsAt, setEndsAt] = useState(toLocalDatetime(later.toISOString()));
  const [maxParticipants, setMaxParticipants] = useState('');
  const [tokenCost, setTokenCost] = useState('0');

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>(getDefaultPollOptions);
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig>(getDefaultAuctionConfig);

  const isPoll = type === 'poll';
  const isAuction = type === 'auction';
  const pollValid = !isPoll || isPollValid(pollQuestion, pollOptions);
  const auctionValid = !isAuction || isAuctionValid(auctionConfig);
  const configValid = pollValid && auctionValid;

  const handleSubmit = () => {
    if (!title || !configValid) return;

    const config: ActivityConfig = {};
    if (isPoll) {
      config.question = pollQuestion.trim();
      config.options = pollOptions
        .filter((o) => o.label.trim().length > 0)
        .map((o, i) => ({ key: `opt_${i + 1}`, label: o.label.trim() }));
    }
    if (isAuction) {
      config.item_name = auctionConfig.item_name.trim();
      config.item_description = auctionConfig.item_description?.trim() || undefined;
      config.starting_price = auctionConfig.starting_price;
      config.min_increment = auctionConfig.min_increment;
    }

    onSubmit({
      title,
      type,
      description,
      config,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      max_participants: maxParticipants,
      token_cost: tokenCost,
    });
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6 space-y-4">
      <h3 className="text-white font-semibold text-lg">{t('actNewTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel label={t('actTitle')} hint={t('actTitleHint')} />
          <input
            type="text"
            placeholder={t('actTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actType')} hint={t('actTypeHint')} />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          >
            {ACTIVITY_TYPES.map((at) => (
              <option key={at} value={at}>
                {at}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel label={t('actStartsAt')} hint={t('actStartsAtHint')} />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actEndsAt')} hint={t('actEndsAtHint')} />
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actMaxParticipants')} hint={t('actMaxParticipantsHint')} />
          <input
            type="number"
            placeholder="∞"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            min={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actTokenCost')} hint={t('actTokenCostHint')} />
          <input
            type="number"
            placeholder="0"
            value={tokenCost}
            onChange={(e) => setTokenCost(e.target.value)}
            min={0}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
      <div>
        <FieldLabel label={t('actDescription')} hint={t('actDescriptionHint')} />
        <textarea
          placeholder={t('actDescription')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

      {isPoll && (
        <PollOptionsEditor
          question={pollQuestion}
          onQuestionChange={setPollQuestion}
          options={pollOptions}
          onOptionsChange={setPollOptions}
        />
      )}

      {isAuction && (
        <AuctionConfigEditor config={auctionConfig} onChange={setAuctionConfig} />
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title || !configValid}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {t('actCreate')}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        {isPoll && !pollValid && title && (
          <span className="text-xs text-amber-400">
            Poll requires a question and at least 2 answer options
          </span>
        )}
        {isAuction && !auctionValid && title && (
          <span className="text-xs text-amber-400">
            Auction requires item name, starting price and min increment
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Edit Activity Form ──────────────────────────────────────────────

function EditActivityForm({
  activity,
  onSave,
  onCancel,
}: {
  activity: Activity;
  onSave: (updates: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('dashboard');
  const [title, setTitle] = useState(activity.title);
  const [type, setType] = useState(activity.type);
  const [description, setDescription] = useState(activity.description || '');
  const [status, setStatus] = useState(activity.status);
  const [startsAt, setStartsAt] = useState(toLocalDatetime(activity.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalDatetime(activity.ends_at));
  const [maxParticipants, setMaxParticipants] = useState(
    activity.max_participants?.toString() || '',
  );
  const [tokenCost, setTokenCost] = useState(activity.token_cost.toString());

  const existingConfig = activity.config || {};
  const [pollQuestion, setPollQuestion] = useState(
    (existingConfig.question as string) || '',
  );
  const [pollOptions, setPollOptions] = useState<PollOption[]>(() => {
    if (Array.isArray(existingConfig.options) && existingConfig.options.length >= 2) {
      return existingConfig.options as PollOption[];
    }
    return getDefaultPollOptions();
  });
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig>(() => {
    if (existingConfig.item_name) {
      return {
        item_name: (existingConfig.item_name as string) || '',
        item_description: (existingConfig.item_description as string) || '',
        starting_price: (existingConfig.starting_price as number) || 100,
        min_increment: (existingConfig.min_increment as number) || 10,
      };
    }
    return getDefaultAuctionConfig();
  });

  const isPoll = type === 'poll';
  const isAuction = type === 'auction';
  const pollValid = !isPoll || isPollValid(pollQuestion, pollOptions);
  const auctionValid = !isAuction || isAuctionValid(auctionConfig);
  const configValid = pollValid && auctionValid;

  const handleSave = () => {
    if (!title || !configValid) return;

    const config: ActivityConfig = {};
    if (isPoll) {
      config.question = pollQuestion.trim();
      config.options = pollOptions
        .filter((o) => o.label.trim().length > 0)
        .map((o, i) => ({ key: `opt_${i + 1}`, label: o.label.trim() }));
    }
    if (isAuction) {
      config.item_name = auctionConfig.item_name.trim();
      config.item_description = auctionConfig.item_description?.trim() || undefined;
      config.starting_price = auctionConfig.starting_price;
      config.min_increment = auctionConfig.min_increment;
    }

    onSave({
      title,
      type,
      description: description || null,
      status,
      config,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      token_cost: parseInt(tokenCost) || 0,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border-2 border-violet-500/50 space-y-4">
      <h3 className="text-white font-semibold">{t('actEditTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel label={t('actTitle')} hint={t('actTitleHint')} />
          <input
            type="text"
            placeholder={t('actTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actType')} hint={t('actTypeHint')} />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          >
            {ACTIVITY_TYPES.map((at) => (
              <option key={at} value={at}>
                {at}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel label={t('actStatus')} hint={t('actStatusHint')} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <FieldLabel label={t('actTokenCost')} hint={t('actTokenCostHint')} />
          <input
            type="number"
            placeholder="0"
            value={tokenCost}
            onChange={(e) => setTokenCost(e.target.value)}
            min={0}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actStartsAt')} hint={t('actStartsAtHint')} />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actEndsAt')} hint={t('actEndsAtHint')} />
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <FieldLabel label={t('actMaxParticipants')} hint={t('actMaxParticipantsHint')} />
          <input
            type="number"
            placeholder="∞"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            min={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
      <div>
        <FieldLabel label={t('actDescription')} hint={t('actDescriptionHint')} />
        <textarea
          placeholder={t('actDescription')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

      {isPoll && (
        <PollOptionsEditor
          question={pollQuestion}
          onQuestionChange={setPollQuestion}
          options={pollOptions}
          onOptionsChange={setPollOptions}
        />
      )}

      {isAuction && (
        <AuctionConfigEditor config={auctionConfig} onChange={setAuctionConfig} />
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!title || !configValid}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {t('actSave')}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        {isPoll && !pollValid && title && (
          <span className="text-xs text-amber-400">
            Poll requires a question and at least 2 answer options
          </span>
        )}
        {isAuction && !auctionValid && title && (
          <span className="text-xs text-amber-400">
            Auction requires item name, starting price and min increment
          </span>
        )}
      </div>
    </div>
  );
}
