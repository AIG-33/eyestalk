import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { MAX_ANNOUNCEMENTS_PER_DAY } from '@eyestalk/shared/constants';

const announcementSchema = z.object({
  venue_id: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { venue_id, content } = parsed.data;

  const { data: venue } = await supabase
    .from('venues')
    .select('id, owner_id, name')
    .eq('id', venue_id)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const { data: isModerator } = await supabase
    .from('venue_moderators')
    .select('id')
    .eq('venue_id', venue_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (venue.owner_id !== user.id && !isModerator) {
    return NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: chat } = await admin
    .from('chats')
    .select('id')
    .eq('venue_id', venue_id)
    .eq('type', 'venue_general')
    .eq('is_active', true)
    .maybeSingle();

  if (!chat) {
    return NextResponse.json(
      { error: 'No active venue chat found' },
      { status: 404 },
    );
  }

  const { count: todayCount } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chat.id)
    .eq('sender_id', user.id)
    .eq('type', 'announcement')
    .gte('created_at', todayStart.toISOString());

  if ((todayCount || 0) >= MAX_ANNOUNCEMENTS_PER_DAY) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ANNOUNCEMENTS_PER_DAY} announcements per day` },
      { status: 429 },
    );
  }

  const { data: message, error: msgError } = await admin
    .from('messages')
    .insert({
      chat_id: chat.id,
      sender_id: user.id,
      content,
      type: 'announcement',
    })
    .select()
    .single();

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ message, announcements_remaining: MAX_ANNOUNCEMENTS_PER_DAY - (todayCount || 0) - 1 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venue_id');

  if (!venueId) {
    return NextResponse.json({ error: 'venue_id is required' }, { status: 400 });
  }

  const { data: chat } = await supabase
    .from('chats')
    .select('id')
    .eq('venue_id', venueId)
    .eq('type', 'venue_general')
    .eq('is_active', true)
    .maybeSingle();

  if (!chat) {
    return NextResponse.json({ announcements: [] });
  }

  const { data: announcements } = await supabase
    .from('messages')
    .select('id, content, created_at, sender:profiles!sender_id(nickname)')
    .eq('chat_id', chat.id)
    .eq('type', 'announcement')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ announcements: announcements || [] });
}
