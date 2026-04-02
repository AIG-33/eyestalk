import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/supabase/api-auth';
import { placeBidSchema } from '@eyestalk/shared/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> },
) {
  const { activityId } = await params;
  const admin = createAdminClient();

  const { data: activity } = await admin
    .from('activities')
    .select('id, type, config, status, ends_at')
    .eq('id', activityId)
    .single();

  if (!activity || activity.type !== 'auction') {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  const { data: bids, error } = await admin
    .from('votes')
    .select('id, user_id, tokens_spent, created_at, option_key')
    .eq('activity_id', activityId)
    .eq('option_key', 'bid')
    .order('tokens_spent', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nicknames = new Map<string, string>();
  if (bids && bids.length > 0) {
    const userIds = [...new Set(bids.map((b) => b.user_id))];
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds);
    profiles?.forEach((p) => nicknames.set(p.id, p.nickname));
  }

  const enrichedBids = (bids || []).map((b) => ({
    id: b.id,
    user_id: b.user_id,
    nickname: nicknames.get(b.user_id) || 'Anonymous',
    amount: b.tokens_spent,
    created_at: b.created_at,
  }));

  const config = activity.config as Record<string, unknown>;
  const highestBid = enrichedBids.length > 0 ? enrichedBids[0].amount : 0;
  const isEnded = new Date(activity.ends_at) <= new Date();

  return NextResponse.json({
    bids: enrichedBids,
    highest_bid: highestBid,
    starting_price: (config.starting_price as number) || 0,
    min_increment: (config.min_increment as number) || 1,
    is_ended: isEnded,
    ends_at: activity.ends_at,
    status: activity.status,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> },
) {
  const { activityId } = await params;
  const admin = createAdminClient();

  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = placeBidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: activity } = await admin
    .from('activities')
    .select('id, type, config, status, ends_at')
    .eq('id', activityId)
    .single();

  if (!activity || activity.type !== 'auction') {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  if (activity.status !== 'active') {
    return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });
  }

  if (new Date(activity.ends_at) <= new Date()) {
    return NextResponse.json({ error: 'Auction has ended' }, { status: 400 });
  }

  const { data: participant } = await admin
    .from('activity_participants')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json(
      { error: 'You must join the auction first' },
      { status: 403 },
    );
  }

  const config = activity.config as Record<string, unknown>;
  const startingPrice = (config.starting_price as number) || 0;
  const minIncrement = (config.min_increment as number) || 1;

  const { data: topBid } = await admin
    .from('votes')
    .select('tokens_spent')
    .eq('activity_id', activityId)
    .eq('option_key', 'bid')
    .order('tokens_spent', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentHighest = topBid?.tokens_spent || 0;
  const minimumBid =
    currentHighest > 0 ? currentHighest + minIncrement : startingPrice;

  if (parsed.data.amount < minimumBid) {
    return NextResponse.json(
      {
        error: `Bid must be at least ${minimumBid} tokens`,
        minimum_bid: minimumBid,
        current_highest: currentHighest,
      },
      { status: 400 },
    );
  }

  const { data: bid, error } = await admin
    .from('votes')
    .insert({
      activity_id: activityId,
      user_id: user.id,
      option_key: 'bid',
      tokens_spent: parsed.data.amount,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bid, new_highest: parsed.data.amount });
}
