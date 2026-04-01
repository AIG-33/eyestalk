import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async () => {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);
  const cutoffISO = cutoff.toISOString();

  // Delete messages from expired check-ins older than 24h
  const { count: deletedMessages } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .lt('created_at', cutoffISO)
    .in(
      'chat_id',
      supabase
        .from('chats')
        .select('id')
        .lt('expires_at', cutoffISO),
    );

  // Delete expired venue stories
  const { count: deletedStories } = await supabase
    .from('venue_stories')
    .delete({ count: 'exact' })
    .lt('expires_at', cutoffISO);

  // Deactivate expired chats
  const { count: deactivatedChats } = await supabase
    .from('chats')
    .update({ is_active: false })
    .eq('is_active', true)
    .not('expires_at', 'is', null)
    .lt('expires_at', cutoffISO);

  const result = {
    deleted_messages: deletedMessages || 0,
    deleted_stories: deletedStories || 0,
    deactivated_chats: deactivatedChats || 0,
  };

  console.log('Cleanup result:', result);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
