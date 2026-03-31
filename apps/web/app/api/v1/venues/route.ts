import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const venuesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().min(0.1).max(50).default(5),
  category: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const parsed = venuesQuerySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
    radius_km: searchParams.get('radius_km'),
    category: searchParams.get('category'),
    search: searchParams.get('search'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lat, lng, radius_km, category, search } = parsed.data;

  let query = supabase
    .rpc('nearby_venues', {
      user_lat: lat,
      user_lng: lng,
      radius_km,
    })
    .select('*');

  if (category) {
    query = query.eq('type', category);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ venues: data });
}
