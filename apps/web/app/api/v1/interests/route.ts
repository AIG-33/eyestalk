import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

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

  const { data: existing } = await supabase
    .from('mutual_interests')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('to_user_id', target_user_id)
    .eq('venue_id', venue_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });
  }

  const { data: reverse } = await supabase
    .from('mutual_interests')
    .select('id')
    .eq('from_user_id', target_user_id)
    .eq('to_user_id', user.id)
    .eq('venue_id', venue_id)
    .single();

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

  if (isMutual && reverse) {
    await admin
      .from('mutual_interests')
      .update({ is_mutual: true })
      .eq('id', reverse.id);
  }

  return NextResponse.json({ interest, is_mutual: isMutual });
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
