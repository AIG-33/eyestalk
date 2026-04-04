import type { SupabaseClient } from '@supabase/supabase-js';

/** Active direct chat between two users (any venue), or null. */
export async function findDirectChatId(
  supabase: SupabaseClient,
  myUserId: string,
  otherUserId: string,
): Promise<string | null> {
  const { data: mine } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', myUserId)
    .is('left_at', null);

  if (!mine?.length) return null;
  const chatIds = mine.map((m) => m.chat_id);

  const { data: theirs } = await supabase
    .from('chat_participants')
    .select('chat_id, chats!inner(type, is_active)')
    .eq('user_id', otherUserId)
    .in('chat_id', chatIds)
    .is('left_at', null);

  const row = theirs?.find(
    (t: { chats?: { type?: string; is_active?: boolean } }) =>
      t.chats?.type === 'direct' && t.chats?.is_active,
  );
  return row?.chat_id ?? null;
}
