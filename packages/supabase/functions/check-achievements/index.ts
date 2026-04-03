import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  let userId: string | null = null;

  try {
    const body = await req.json();
    userId = body.user_id;
  } catch {
    // Allow GET calls without body for batch processing
  }

  if (userId) {
    const result = await checkUserAchievements(userId);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Batch: check all active users (for cron)
  const { data: recentCheckins } = await supabase
    .from('checkins')
    .select('user_id')
    .eq('status', 'active');

  const uniqueUsers = [...new Set((recentCheckins || []).map((c: any) => c.user_id))];
  const results = [];

  for (const uid of uniqueUsers) {
    const r = await checkUserAchievements(uid);
    if (r.newly_unlocked.length > 0) results.push(r);
  }

  return new Response(
    JSON.stringify({
      message: `Checked ${uniqueUsers.length} users, ${results.length} had new achievements`,
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

async function checkUserAchievements(userId: string) {
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .order('sort_order');

  if (!achievements?.length) return { user_id: userId, newly_unlocked: [] };

  const { data: existing } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId);

  const unlockedSet = new Set(
    (existing || []).filter((e: any) => e.unlocked_at).map((e: any) => e.achievement_id),
  );

  const [checkinStats, socialStats, activityStats] = await Promise.all([
    getCheckinStats(userId),
    getSocialStats(userId),
    getActivityStats(userId),
  ]);

  const newlyUnlocked: any[] = [];

  for (const achievement of achievements) {
    if (unlockedSet.has(achievement.id)) continue;

    const progress = computeProgress(achievement.slug, checkinStats, socialStats, activityStats);
    const isUnlocked = progress >= achievement.threshold;

    await supabase
      .from('user_achievements')
      .upsert(
        {
          user_id: userId,
          achievement_id: achievement.id,
          progress,
          unlocked_at: isUnlocked ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,achievement_id' },
      );

    if (isUnlocked && achievement.token_reward > 0) {
      await supabase.rpc('add_tokens', {
        p_user_id: userId,
        p_amount: achievement.token_reward,
        p_type: 'achievement_reward',
        p_description: `Achievement: ${achievement.slug}`,
      });

      newlyUnlocked.push({ slug: achievement.slug, icon: achievement.icon, token_reward: achievement.token_reward });
    }
  }

  return { user_id: userId, newly_unlocked: newlyUnlocked };
}

async function getCheckinStats(userId: string) {
  const { data: checkins } = await supabase
    .from('checkins')
    .select('venue_id, checked_in_at')
    .eq('user_id', userId);

  const all = checkins || [];
  const uniqueVenues = new Set(all.map((c: any) => c.venue_id)).size;

  const venueCountMap: Record<string, number> = {};
  for (const c of all) {
    venueCountMap[c.venue_id] = (venueCountMap[c.venue_id] || 0) + 1;
  }

  return {
    totalCheckins: all.length,
    uniqueVenues,
    maxAtSingleVenue: Math.max(0, ...Object.values(venueCountMap)),
    weeklyStreak: getWeeklyStreak(all.map((c: any) => c.checked_in_at)),
  };
}

async function getSocialStats(userId: string) {
  const { count: wavesSent } = await supabase
    .from('mutual_interests')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', userId);

  const { count: mutualMatches } = await supabase
    .from('mutual_interests')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', userId)
    .eq('is_mutual', true);

  const { count: messagesSent } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', userId);

  return { wavesSent: wavesSent || 0, mutualMatches: mutualMatches || 0, messagesSent: messagesSent || 0 };
}

async function getActivityStats(userId: string) {
  const { count: activitiesJoined } = await supabase
    .from('activity_participants')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: pollVotes } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  return { activitiesJoined: activitiesJoined || 0, pollVotes: pollVotes || 0 };
}

function computeProgress(
  slug: string,
  c: { totalCheckins: number; uniqueVenues: number; maxAtSingleVenue: number; weeklyStreak: number },
  s: { wavesSent: number; mutualMatches: number; messagesSent: number },
  a: { activitiesJoined: number; pollVotes: number },
): number {
  switch (slug) {
    case 'first_checkin':    return c.totalCheckins;
    case 'venues_5':
    case 'venues_10':
    case 'venues_25':
    case 'venues_50':        return c.uniqueVenues;
    case 'regular_5':
    case 'regular_10':
    case 'regular_25':       return c.maxAtSingleVenue;
    case 'streak_3':
    case 'streak_7':         return c.weeklyStreak;
    case 'first_wave':       return s.wavesSent;
    case 'matches_5':
    case 'matches_10':       return s.mutualMatches;
    case 'messages_50':
    case 'messages_200':     return s.messagesSent;
    case 'first_activity':
    case 'activities_10':    return a.activitiesJoined;
    case 'first_poll_vote':  return a.pollVotes;
    default:                 return 0;
  }
}

function getWeeklyStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const weeks = new Set(
    dates.map((d) => {
      const dt = new Date(d);
      const startOfYear = new Date(dt.getFullYear(), 0, 1);
      const diff = dt.getTime() - startOfYear.getTime();
      return `${dt.getFullYear()}-${Math.floor(diff / (7 * 24 * 60 * 60 * 1000))}`;
    }),
  );

  const sorted = Array.from(weeks).sort();
  let max = 1;
  let cur = 1;

  for (let i = 1; i < sorted.length; i++) {
    const [py, pw] = sorted[i - 1].split('-').map(Number);
    const [cy, cw] = sorted[i].split('-').map(Number);
    if ((cy === py && cw === pw + 1) || (cy === py + 1 && pw >= 51 && cw === 0)) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 1;
    }
  }

  return max;
}
