import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createActivitySchema } from '@eyestalk/shared/validators';

export async function POST(request: NextRequest) {
  const supabase = await createApiRouteSupabase(request);
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', parsed.data.venue_id)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const { data: isModerator } = await supabase
    .from('venue_moderators')
    .select('id')
    .eq('venue_id', parsed.data.venue_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (venue.owner_id !== user.id && !isModerator) {
    return NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 });
  }

  const { data: activity, error } = await admin
    .from('activities')
    .insert({
      ...parsed.data,
      created_by: user.id,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity });
}

export async function GET(request: NextRequest) {
  const supabase = await createApiRouteSupabase(request);
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venue_id');
  const status = searchParams.get('status') || 'active';

  if (!venueId) {
    return NextResponse.json({ error: 'venue_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*, activity_participants(count)')
    .eq('venue_id', venueId)
    .eq('status', status)
    .order('starts_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activities: data });
}
