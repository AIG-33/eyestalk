import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/supabase/api-auth';
import { z } from 'zod';

const createChatSchema = z.object({
  target_user_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  type: z.enum(['direct', 'group']).default('direct'),
  initial_message: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const admin = createAdminClient();

  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { target_user_id, venue_id, initial_message } = parsed.data;

  const { data: blocked } = await admin
    .from('blocks')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${target_user_id}),and(blocker_id.eq.${target_user_id},blocked_id.eq.${user.id})`)
    .maybeSingle();

  if (blocked) {
    return NextResponse.json({ error: 'Cannot chat with this user' }, { status: 403 });
  }

  const { data: existingParticipants } = await admin
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', user.id)
    .is('left_at', null);

  if (existingParticipants && existingParticipants.length > 0) {
    const chatIds = existingParticipants.map((p: any) => p.chat_id);
    const { data: existingChat } = await admin
      .from('chat_participants')
      .select('chat_id, chats!inner(id, venue_id, type, is_active)')
      .eq('user_id', target_user_id)
      .in('chat_id', chatIds)
      .is('left_at', null);

    const directChat = existingChat?.find((p: any) => p.chats?.type === 'direct' && p.chats?.is_active);
    if (directChat) {
      const { data: chat } = await admin
        .from('chats')
        .select()
        .eq('id', directChat.chat_id)
        .single();
      return NextResponse.json({ chat });
    }
  }

  const { data: chat, error: chatError } = await admin
    .from('chats')
    .insert({ venue_id, type: 'direct' })
    .select()
    .single();

  if (chatError) {
    return NextResponse.json({ error: chatError.message }, { status: 500 });
  }

  await admin.from('chat_participants').insert([
    { chat_id: chat.id, user_id: user.id },
    { chat_id: chat.id, user_id: target_user_id },
  ]);

  if (initial_message) {
    await admin.from('messages').insert({
      chat_id: chat.id,
      sender_id: user.id,
      content: initial_message,
      type: 'text',
    });
  }

  return NextResponse.json({ chat });
}

export async function GET(request: NextRequest) {
  const admin = createAdminClient();

  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await admin
    .from('chat_participants')
    .select(`
      chat_id,
      chats!inner(id, venue_id, type, name, is_active, created_at, expires_at,
        venues(name, type)
      )
    `)
    .eq('user_id', user.id)
    .is('left_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chats: data });
}
