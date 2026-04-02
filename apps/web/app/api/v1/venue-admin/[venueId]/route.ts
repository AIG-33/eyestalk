import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
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
    .select('id, owner_id')
    .eq('id', venueId)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  if (venue.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Clean up storage (venue logos)
  const { data: logoFiles } = await admin.storage
    .from('venue-logos')
    .list(venueId);

  if (logoFiles && logoFiles.length > 0) {
    await admin.storage
      .from('venue-logos')
      .remove(logoFiles.map((f) => `${venueId}/${f.name}`));
  }

  // Delete the venue — all child tables cascade automatically
  const { error } = await admin
    .from('venues')
    .delete()
    .eq('id', venueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

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

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .eq('owner_id', user.id)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found or not authorized' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];

  const [
    { count: activeUsers },
    { count: totalCheckinsToday },
    { count: activeActivities },
    { data: recentCheckins },
  ] = await Promise.all([
    supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('status', 'active'),
    supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('checked_in_at', `${today}T00:00:00`),
    supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('status', 'active'),
    supabase
      .from('checkins')
      .select('checked_in_at')
      .eq('venue_id', venueId)
      .gte('checked_in_at', `${today}T00:00:00`)
      .order('checked_in_at', { ascending: true }),
  ]);

  const hourlyDistribution = getHourlyDistribution(recentCheckins || []);

  return NextResponse.json({
    venue,
    stats: {
      active_users: activeUsers || 0,
      total_checkins_today: totalCheckinsToday || 0,
      active_activities: activeActivities || 0,
      hourly_distribution: hourlyDistribution,
    },
  });
}

function getHourlyDistribution(checkins: { checked_in_at: string }[]) {
  const hours: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hours[i] = 0;

  checkins.forEach((c) => {
    const hour = new Date(c.checked_in_at).getHours();
    hours[hour]++;
  });

  return Object.entries(hours).map(([hour, count]) => ({
    hour: Number(hour),
    count,
  }));
}
