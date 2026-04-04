import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendExpoPushBatch } from '@/lib/push/expo-push';
import { z } from 'zod';

const notifySchema = z.object({
  service_id: z.string().uuid(),
});

/**
 * POST — notify subscribers that new slots are available for a service.
 * Called by the venue dashboard after generating or manually creating slots.
 * Only venue owner / moderator can trigger this.
 */
export async function POST(request: NextRequest) {
  const supabase = await createApiRouteSupabase(request);
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = notifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { service_id } = parsed.data;

  const { data: service } = await admin
    .from('venue_services')
    .select('id, title, venue_id')
    .eq('id', service_id)
    .single();

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const { data: venue } = await admin
    .from('venues')
    .select('id, owner_id, name')
    .eq('id', service.venue_id)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const { data: isModerator } = await admin
    .from('venue_moderators')
    .select('id')
    .eq('venue_id', venue.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (venue.owner_id !== user.id && !isModerator) {
    return NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 });
  }

  void (async () => {
    try {
      const { data: subs } = await admin
        .from('venue_service_subscriptions')
        .select('user_id')
        .eq('service_id', service_id);

      const recipientIds = new Set<string>();
      for (const row of subs || []) {
        if (row.user_id && row.user_id !== user.id) recipientIds.add(row.user_id);
      }

      if (recipientIds.size === 0) return;

      const { data: tokens } = await admin
        .from('user_push_tokens')
        .select('expo_push_token')
        .in('user_id', [...recipientIds]);

      const toSend = (tokens || [])
        .map((t) => t.expo_push_token)
        .filter(
          (t): t is string =>
            typeof t === 'string' && t.startsWith('ExponentPushToken'),
        );

      const uniqueTokens = [...new Set(toSend)];
      if (uniqueTokens.length === 0) return;

      const title = venue.name.length > 40 ? `${venue.name.slice(0, 37)}…` : venue.name;
      const pushBody = `New slots available for "${service.title}"`;

      await sendExpoPushBatch(
        uniqueTokens.map((to) => ({
          to,
          title,
          body: pushBody,
          sound: 'default',
          channelId: 'service-updates',
          data: {
            type: 'service_update',
            venueId: venue.id,
            serviceId: service_id,
          },
        })),
      );
    } catch (e) {
      console.error('[service-notifications] push fan-out failed', e);
    }
  })();

  return NextResponse.json({ ok: true });
}
