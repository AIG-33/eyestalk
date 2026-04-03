import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { CHECKIN_REWARD_TOKENS, CHECKIN_DURATION_HOURS, CHECKIN_REWARD_COOLDOWN_HOURS } from '@eyestalk/shared/constants';

const checkinSchema = z.object({
  venue_id: z.string().uuid(),
  qr_code: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { venue_id, qr_code, lat, lng } = parsed.data;

  const { data: existingCheckin } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (existingCheckin) {
    return NextResponse.json(
      { error: 'Already checked in to a venue' },
      { status: 409 },
    );
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, latitude, longitude, geofence_radius')
    .eq('id', venue_id)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  if (qr_code) {
    const { data: qr } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('venue_id', venue_id)
      .eq('code', qr_code)
      .eq('is_active', true)
      .single();

    if (!qr) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }
  } else {
    const distance = getDistanceMeters(lat, lng, Number(venue.latitude), Number(venue.longitude));
    if (distance > (venue.geofence_radius || 100)) {
      return NextResponse.json({ error: 'Too far from venue' }, { status: 400 });
    }
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CHECKIN_DURATION_HOURS);

  const cooldownCutoff = new Date();
  cooldownCutoff.setHours(cooldownCutoff.getHours() - CHECKIN_REWARD_COOLDOWN_HOURS);

  const { data: recentRewarded } = await admin
    .from('token_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'checkin_reward')
    .gte('created_at', cooldownCutoff.toISOString())
    .limit(1);

  const eligibleForReward = !recentRewarded || recentRewarded.length === 0;
  const tokensEarned = eligibleForReward ? CHECKIN_REWARD_TOKENS : 0;

  const { data: checkin, error: checkinError } = await admin
    .from('checkins')
    .insert({
      user_id: user.id,
      venue_id,
      method: qr_code ? 'qr' : 'geofence',
      status: 'active',
      tokens_earned: tokensEarned,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (checkinError) {
    return NextResponse.json({ error: checkinError.message }, { status: 500 });
  }

  if (eligibleForReward) {
    await admin.rpc('add_tokens', {
      p_user_id: user.id,
      p_amount: CHECKIN_REWARD_TOKENS,
      p_type: 'checkin_reward',
      p_venue_id: venue_id,
      p_description: `Check-in at ${venue.name}`,
    });
  }

  checkAchievementsAsync(admin, user.id);

  return NextResponse.json({
    checkin,
    tokens_earned: tokensEarned,
    reward_cooldown: !eligibleForReward,
  });
}

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('checkins')
    .select('*, venues(name, type, logo_url)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  return NextResponse.json({ checkin: data });
}

async function checkAchievementsAsync(admin: any, userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/check-achievements`, {
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

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
