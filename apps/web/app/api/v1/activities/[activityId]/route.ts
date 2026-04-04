import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateActivitySchema } from '@eyestalk/shared/validators';

async function authorizeForActivity(activityId: string, request: NextRequest) {
  const supabase = await createApiRouteSupabase(request);
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: activity } = await admin
    .from('activities')
    .select('id, venue_id')
    .eq('id', activityId)
    .single();

  if (!activity) {
    return { error: NextResponse.json({ error: 'Activity not found' }, { status: 404 }) };
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', activity.venue_id)
    .single();

  const { data: isModerator } = await supabase
    .from('venue_moderators')
    .select('id')
    .eq('venue_id', activity.venue_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (venue?.owner_id !== user.id && !isModerator) {
    return { error: NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 }) };
  }

  return { user, activity, admin };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> },
) {
  const { activityId } = await params;
  const auth = await authorizeForActivity(activityId, request);
  if ('error' in auth && auth.error) return auth.error;
  const { admin } = auth as Exclude<typeof auth, { error: NextResponse }>;

  const body = await request.json();
  const parsed = updateActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: updated, error } = await admin
    .from('activities')
    .update(parsed.data)
    .eq('id', activityId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> },
) {
  const { activityId } = await params;
  const auth = await authorizeForActivity(activityId, request);
  if ('error' in auth && auth.error) return auth.error;
  const { admin } = auth as Exclude<typeof auth, { error: NextResponse }>;

  const { error } = await admin.from('activities').delete().eq('id', activityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
