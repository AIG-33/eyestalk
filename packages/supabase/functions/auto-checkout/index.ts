import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async () => {
  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from('checkins')
    .update({
      status: 'expired',
      checked_out_at: now,
    })
    .eq('status', 'active')
    .lt('expires_at', now)
    .select('id, user_id, venue_id');

  if (error) {
    console.error('Auto-checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`Auto-checked out ${expired?.length || 0} users`);

  return new Response(
    JSON.stringify({
      message: `Processed ${expired?.length || 0} expired check-ins`,
      expired_ids: expired?.map((c) => c.id) || [],
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
