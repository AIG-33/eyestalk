import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/supabase/api-auth';
import { z } from 'zod';
import { POLL_PARTICIPATION_REWARD_TOKENS } from '@eyestalk/shared/constants';

const bodySchema = z.object({
  option_key: z.string().min(1).max(100),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> },
) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { activityId } = await params;
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }
  const { option_key } = parsedBody.data;

  const admin = createAdminClient();

  const { data: activity, error: actErr } = await admin
    .from('activities')
    .select('id, venue_id, type, status, ends_at, config')
    .eq('id', activityId)
    .single();

  if (actErr || !activity) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
  }

  if (activity.type !== 'poll') {
    return NextResponse.json({ error: 'Not a poll' }, { status: 400 });
  }

  const ended =
    activity.status === 'completed' ||
    activity.status === 'cancelled' ||
    (activity.ends_at && new Date(activity.ends_at) <= new Date());

  if (activity.status !== 'active' || ended) {
    return NextResponse.json({ error: 'Poll is not active' }, { status: 400 });
  }

  const options = (activity.config as { options?: { key: string }[] })?.options || [];
  if (!options.some((o) => o.key === option_key)) {
    return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
  }

  const { data: existingVote } = await admin
    .from('votes')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingVote) {
    return NextResponse.json({ error: 'Already voted' }, { status: 409 });
  }

  const { data: vote, error: voteErr } = await admin
    .from('votes')
    .insert({
      activity_id: activityId,
      user_id: user.id,
      option_key,
    })
    .select('id')
    .single();

  if (voteErr) {
    if (voteErr.code === '23505') {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }
    return NextResponse.json({ error: voteErr.message }, { status: 500 });
  }

  const { data: priorReward } = await admin
    .from('token_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'poll_participation_reward')
    .eq('reference_id', activityId)
    .limit(1);

  let tokens_earned = 0;
  if (!priorReward?.length) {
    const { data: venue } = await admin
      .from('venues')
      .select('name')
      .eq('id', activity.venue_id)
      .single();

    await admin.rpc('add_tokens', {
      p_user_id: user.id,
      p_amount: POLL_PARTICIPATION_REWARD_TOKENS,
      p_type: 'poll_participation_reward',
      p_venue_id: activity.venue_id,
      p_description: `Poll: ${venue?.name || 'venue'}`,
      p_reference_id: activityId,
    });
    tokens_earned = POLL_PARTICIPATION_REWARD_TOKENS;
  }

  triggerAchievementCheck(user.id);

  return NextResponse.json({ vote, tokens_earned });
}

function triggerAchievementCheck(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      fetch(`${supabaseUrl}/functions/v1/check-achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ user_id: userId }),
      }).catch(() => {});
    }
  } catch {}
}
