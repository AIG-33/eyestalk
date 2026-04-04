import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const loyaltyTierSchema = z.object({
  name: z.string().min(1).max(50),
  min_checkins: z.number().int().min(1),
  token_reward: z.number().int().min(0).default(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;
  const supabase = await createApiRouteSupabase(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', venueId)
    .single();

  if (!venue || venue.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: tiers } = await admin
    .from('venue_loyalty_tiers')
    .select('*')
    .eq('venue_id', venueId)
    .order('min_checkins', { ascending: true });

  return NextResponse.json({ tiers: tiers || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;
  const supabase = await createApiRouteSupabase(request);
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', venueId)
    .single();

  if (!venue || venue.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = loyaltyTierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: tier, error } = await admin
    .from('venue_loyalty_tiers')
    .insert({
      venue_id: venueId,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tier });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;
  const supabase = await createApiRouteSupabase(request);
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', venueId)
    .single();

  if (!venue || venue.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tierId = searchParams.get('tier_id');

  if (!tierId) {
    return NextResponse.json({ error: 'tier_id is required' }, { status: 400 });
  }

  await admin
    .from('venue_loyalty_tiers')
    .delete()
    .eq('id', tierId)
    .eq('venue_id', venueId);

  return NextResponse.json({ success: true });
}
