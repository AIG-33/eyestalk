import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteParams = { params: Promise<{ venueId: string }> };

async function authorizeOwner(venueId: string, request: NextRequest) {
  const supabase = await createApiRouteSupabase(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 } as const;

  const admin = createAdminClient();
  const { data: venue } = await admin
    .from('venues')
    .select('id, owner_id')
    .eq('id', venueId)
    .single();

  if (!venue) return { error: 'Venue not found', status: 404 } as const;
  if (venue.owner_id !== user.id) return { error: 'Forbidden', status: 403 } as const;

  return { user, venue, admin } as const;
}

// ── Logo upload ──────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { venueId } = await params;
  const auth = await authorizeOwner(venueId, request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { admin } = auth;
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 2 MB.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF.' }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 });
  }

  const filePath = `${venueId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from('venue-logos')
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from('venue-logos')
    .getPublicUrl(filePath);

  const logoUrl = `${publicUrl}?t=${Date.now()}`;
  await admin.from('venues').update({ logo_url: logoUrl }).eq('id', venueId);

  return NextResponse.json({ logo_url: logoUrl });
}

// ── Logo delete ──────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { venueId } = await params;
  const auth = await authorizeOwner(venueId, request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { admin } = auth;
  const body = await request.json().catch(() => ({}));

  if (body.action === 'remove_logo') {
    const { data: files } = await admin.storage.from('venue-logos').list(venueId);
    if (files && files.length > 0) {
      await admin.storage.from('venue-logos').remove(files.map((f) => `${venueId}/${f.name}`));
    }
    await admin.from('venues').update({ logo_url: null }).eq('id', venueId);
    return NextResponse.json({ logo_url: null });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── Venue delete ─────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { venueId } = await params;
  const auth = await authorizeOwner(venueId, request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { admin } = auth;

  const { data: logoFiles } = await admin.storage.from('venue-logos').list(venueId);
  if (logoFiles && logoFiles.length > 0) {
    await admin.storage.from('venue-logos').remove(logoFiles.map((f) => `${venueId}/${f.name}`));
  }

  const { error } = await admin.from('venues').delete().eq('id', venueId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { venueId } = await params;
  const supabase = await createApiRouteSupabase(request);

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
