import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: venue } = await admin
    .from('venues')
    .select('id, owner_id, name')
    .eq('id', venueId)
    .single();

  if (!venue || venue.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let { data: chat } = await admin
    .from('chats')
    .select('id')
    .eq('venue_id', venueId)
    .eq('type', 'venue_general')
    .eq('is_active', true)
    .maybeSingle();

  if (!chat) {
    const { data: newChat, error } = await admin
      .from('chats')
      .insert({ venue_id: venueId, type: 'venue_general', name: 'General' })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    chat = newChat;
  }

  await admin
    .from('chat_participants')
    .upsert(
      { chat_id: chat!.id, user_id: user.id },
      { onConflict: 'chat_id,user_id' },
    );

  return NextResponse.json({ chatId: chat!.id, venueName: venue.name });
}
