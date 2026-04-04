import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;
  const supabase = await createApiRouteSupabase(request);
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', venueId)
    .single();

  if (!venue || venue.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: checkins } = await admin
    .from('checkins')
    .select('user_id, checked_in_at')
    .eq('venue_id', venueId);

  if (!checkins?.length) {
    return NextResponse.json({ guests: [], loyalty_tiers: [] });
  }

  const guestMap: Record<string, { count: number; lastVisit: string }> = {};
  for (const c of checkins) {
    if (!guestMap[c.user_id]) {
      guestMap[c.user_id] = { count: 0, lastVisit: c.checked_in_at };
    }
    guestMap[c.user_id].count++;
    if (c.checked_in_at > guestMap[c.user_id].lastVisit) {
      guestMap[c.user_id].lastVisit = c.checked_in_at;
    }
  }

  const topUserIds = Object.entries(guestMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20)
    .map(([id]) => id);

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname, avatar_url')
    .in('id', topUserIds);

  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.id, p]),
  );

  const { data: loyaltyTiers } = await admin
    .from('venue_loyalty_tiers')
    .select('*')
    .eq('venue_id', venueId)
    .order('min_checkins', { ascending: true });

  const guests = topUserIds.map((userId) => {
    const p = profileMap.get(userId);
    const stats = guestMap[userId];
    const tier = findTier(stats.count, loyaltyTiers || []);
    return {
      user_id: userId,
      nickname: p?.nickname || 'Unknown',
      avatar_url: p?.avatar_url || null,
      checkin_count: stats.count,
      last_visit: stats.lastVisit,
      loyalty_tier: tier?.name || null,
    };
  });

  return NextResponse.json({
    guests,
    loyalty_tiers: loyaltyTiers || [],
    total_unique_guests: Object.keys(guestMap).length,
  });
}

function findTier(
  checkinCount: number,
  tiers: { name: string; min_checkins: number }[],
): { name: string; min_checkins: number } | null {
  let best = null;
  for (const tier of tiers) {
    if (checkinCount >= tier.min_checkins) {
      if (!best || tier.min_checkins > best.min_checkins) {
        best = tier;
      }
    }
  }
  return best;
}
