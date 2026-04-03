import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/supabase/api-auth';

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: achievements } = await admin
    .from('achievements')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: userAchievements } = await admin
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id);

  const userMap = new Map(
    (userAchievements || []).map((ua: any) => [ua.achievement_id, ua]),
  );

  const merged = (achievements || []).map((a: any) => {
    const ua = userMap.get(a.id);
    return {
      ...a,
      progress: ua?.progress || 0,
      unlocked_at: ua?.unlocked_at || null,
      is_unlocked: !!ua?.unlocked_at,
    };
  });

  return NextResponse.json({ achievements: merged });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const body = await request.json();
  const { action } = body;

  if (action !== 'check') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const newlyUnlocked = await checkAndUnlockAchievements(admin, user.id);

  return NextResponse.json({ newly_unlocked: newlyUnlocked });
}

async function checkAndUnlockAchievements(admin: any, userId: string) {
  const { data: achievements } = await admin
    .from('achievements')
    .select('*')
    .order('sort_order');

  if (!achievements?.length) return [];

  const { data: existing } = await admin
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId);

  const unlockedSet = new Set(
    (existing || [])
      .filter((e: any) => e.unlocked_at)
      .map((e: any) => e.achievement_id),
  );

  const [checkinStats, socialStats, activityStats] = await Promise.all([
    getCheckinStats(admin, userId),
    getSocialStats(admin, userId),
    getActivityStats(admin, userId),
  ]);

  const newlyUnlocked: any[] = [];

  for (const achievement of achievements) {
    if (unlockedSet.has(achievement.id)) continue;

    const progress = computeProgress(achievement.slug, checkinStats, socialStats, activityStats);
    const isUnlocked = progress >= achievement.threshold;

    await admin
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
      await admin.rpc('add_tokens', {
        p_user_id: userId,
        p_amount: achievement.token_reward,
        p_type: 'achievement_reward',
        p_description: `Achievement: ${achievement.slug}`,
      });

      newlyUnlocked.push({ ...achievement, progress });
    }
  }

  return newlyUnlocked;
}

async function getCheckinStats(admin: any, userId: string) {
  const { data: checkins } = await admin
    .from('checkins')
    .select('venue_id, checked_in_at')
    .eq('user_id', userId);

  const allCheckins = checkins || [];
  const uniqueVenues = new Set(allCheckins.map((c: any) => c.venue_id)).size;
  const totalCheckins = allCheckins.length;

  const venueCountMap: Record<string, number> = {};
  for (const c of allCheckins) {
    venueCountMap[c.venue_id] = (venueCountMap[c.venue_id] || 0) + 1;
  }
  const maxAtSingleVenue = Math.max(0, ...Object.values(venueCountMap));

  const weeklyCheckins = getWeeklyStreak(allCheckins.map((c: any) => c.checked_in_at));

  return { totalCheckins, uniqueVenues, maxAtSingleVenue, weeklyStreak: weeklyCheckins };
}

async function getSocialStats(admin: any, userId: string) {
  const { count: wavesSent } = await admin
    .from('mutual_interests')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', userId);

  const { count: mutualMatches } = await admin
    .from('mutual_interests')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', userId)
    .eq('is_mutual', true);

  const { count: messagesSent } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', userId);

  return {
    wavesSent: wavesSent || 0,
    mutualMatches: mutualMatches || 0,
    messagesSent: messagesSent || 0,
  };
}

async function getActivityStats(admin: any, userId: string) {
  const { count: activitiesJoined } = await admin
    .from('activity_participants')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: pollVotes } = await admin
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    activitiesJoined: activitiesJoined || 0,
    pollVotes: pollVotes || 0,
  };
}

function computeProgress(
  slug: string,
  checkin: { totalCheckins: number; uniqueVenues: number; maxAtSingleVenue: number; weeklyStreak: number },
  social: { wavesSent: number; mutualMatches: number; messagesSent: number },
  activity: { activitiesJoined: number; pollVotes: number },
): number {
  switch (slug) {
    case 'first_checkin':    return checkin.totalCheckins;
    case 'venues_5':
    case 'venues_10':
    case 'venues_25':
    case 'venues_50':        return checkin.uniqueVenues;
    case 'regular_5':
    case 'regular_10':
    case 'regular_25':       return checkin.maxAtSingleVenue;
    case 'streak_3':
    case 'streak_7':         return checkin.weeklyStreak;
    case 'first_wave':       return social.wavesSent;
    case 'matches_5':
    case 'matches_10':       return social.mutualMatches;
    case 'messages_50':
    case 'messages_200':     return social.messagesSent;
    case 'first_activity':
    case 'activities_10':    return activity.activitiesJoined;
    case 'first_poll_vote':  return activity.pollVotes;
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

  const sortedWeeks = Array.from(weeks).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedWeeks.length; i++) {
    const [prevYear, prevWeek] = sortedWeeks[i - 1].split('-').map(Number);
    const [curYear, curWeek] = sortedWeeks[i].split('-').map(Number);

    if ((curYear === prevYear && curWeek === prevWeek + 1) ||
        (curYear === prevYear + 1 && prevWeek >= 51 && curWeek === 0)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
