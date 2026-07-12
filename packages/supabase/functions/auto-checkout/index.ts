import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Legacy rows created before checkout_policy existed behave like today's default.
const DEFAULT_POLICY = ['geofence_exit', 'session_timeout'];

type Row = {
  id: string;
  expires_at: string;
  venues: { expires_at: string | null; checkout_policy: string[] | null } | null;
};

Deno.serve(async () => {
  const now = new Date();
  const nowIso = now.toISOString();

  // Look at every active check-in together with its venue's auto check-out policy so
  // we only end sessions the owner opted into, and record WHY each one ended.
  const { data: active, error } = await supabase
    .from('checkins')
    .select('id, expires_at, venues(expires_at, checkout_policy)')
    .eq('status', 'active');

  if (error) {
    console.error('Auto-checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const timedOut: string[] = [];
  const venueClosed: string[] = [];

  for (const row of (active ?? []) as Row[]) {
    const policy = row.venues?.checkout_policy ?? DEFAULT_POLICY;

    // Session timeout: the check-in's own expiry window elapsed.
    if (policy.includes('session_timeout') && row.expires_at && new Date(row.expires_at) < now) {
      timedOut.push(row.id);
      continue;
    }

    // Venue close: a pop-up venue reached its end time.
    const venueExpiry = row.venues?.expires_at;
    if (policy.includes('venue_close') && venueExpiry && new Date(venueExpiry) < now) {
      venueClosed.push(row.id);
    }
  }

  const applyCheckout = async (ids: string[], reason: string) => {
    if (ids.length === 0) return;
    const { error: updErr } = await supabase
      .from('checkins')
      .update({ status: 'expired', checked_out_at: nowIso, checkout_reason: reason })
      .in('id', ids);
    if (updErr) console.error(`Auto-checkout (${reason}) error:`, updErr);
  };

  await applyCheckout(timedOut, 'session_timeout');
  await applyCheckout(venueClosed, 'venue_closed');

  const total = timedOut.length + venueClosed.length;
  console.log(`Auto-checked out ${total} users (timeout: ${timedOut.length}, venue closed: ${venueClosed.length})`);

  return new Response(
    JSON.stringify({
      message: `Processed ${total} expired check-ins`,
      session_timeout_ids: timedOut,
      venue_closed_ids: venueClosed,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
