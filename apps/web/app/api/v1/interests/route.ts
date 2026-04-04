import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrCreateDirectChat } from '@/lib/direct-chat';
import { z } from 'zod';
import { MATCH_REWARD_TOKENS } from '@eyestalk/shared/constants';

const sendInterestSchema = z.object({
  target_user_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  type: z.enum(['wave', 'like', 'compliment']),
  message: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = sendInterestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { target_user_id, venue_id, type, message } = parsed.data;

  if (target_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot send interest to yourself' }, { status: 400 });
  }

  const { data: blocked } = await admin
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${target_user_id}),and(blocker_id.eq.${target_user_id},blocked_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (blocked) {
    return NextResponse.json({ error: 'Cannot interact with this user' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('mutual_interests')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('to_user_id', target_user_id)
    .eq('venue_id', venue_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });
  }

  const { data: reverse } = await supabase
    .from('mutual_interests')
    .select('id')
    .eq('from_user_id', target_user_id)
    .eq('to_user_id', user.id)
    .eq('venue_id', venue_id)
    .maybeSingle();

  const isMutual = !!reverse;

  const { data: interest, error } = await admin
    .from('mutual_interests')
    .insert({
      from_user_id: user.id,
      to_user_id: target_user_id,
      venue_id,
      type,
      message,
      is_mutual: isMutual,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (isMutual && reverse?.id) {
    await admin
      .from('mutual_interests')
      .update({ is_mutual: true })
      .eq('id', reverse.id);
  }

  if (isMutual && interest?.id && type === 'wave') {
    await grantMatchRewards(admin, {
      interestId: interest.id,
      venueId: venue_id,
      userA: user.id,
      userB: target_user_id,
    });
  }

  let chat_id: string | null = null;
  if (type === 'wave') {
    try {
      const { id: chatId } = await getOrCreateDirectChat(admin, {
        userId: user.id,
        peerUserId: target_user_id,
        venueId: venue_id,
      });
      chat_id = chatId;

      await admin.from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        content: '👋',
        type: 'wave',
      });

      if (isMutual) {
        await admin.from('messages').insert({
          chat_id: chatId,
          sender_id: user.id,
          content: '__match__',
          type: 'system',
        });
      }
    } catch (err) {
      console.error('[interests] wave chat/message:', err);
    }
  }

  triggerAchievementCheck(user.id);
  if (isMutual) triggerAchievementCheck(target_user_id);

  return NextResponse.json({ interest, is_mutual: isMutual, chat_id });
}

async function grantMatchRewards(
  admin: ReturnType<typeof createAdminClient>,
  args: { interestId: string; venueId: string; userA: string; userB: string },
) {
  const { data: venue } = await admin
    .from('venues')
    .select('name')
    .eq('id', args.venueId)
    .single();

  const desc = `Match at ${venue?.name || 'venue'}`;

  for (const uid of [args.userA, args.userB]) {
    const { data: existing } = await admin
      .from('token_transactions')
      .select('id')
      .eq('user_id', uid)
      .eq('type', 'match_reward')
      .eq('reference_id', args.interestId)
      .limit(1);

    if (existing?.length) continue;

    await admin.rpc('add_tokens', {
      p_user_id: uid,
      p_amount: MATCH_REWARD_TOKENS,
      p_type: 'match_reward',
      p_venue_id: args.venueId,
      p_description: desc,
      p_reference_id: args.interestId,
    });
  }
}

async function triggerAchievementCheck(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      fetch(`${supabaseUrl}/functions/v1/check-achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ user_id: userId }),
      }).catch(() => {});
    }
  } catch {}
}

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('mutual_interests')
    .select('*, from_user:profiles!from_user_id(nickname, avatar_url)')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ interests: data });
}
