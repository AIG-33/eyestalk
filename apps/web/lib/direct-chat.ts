import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns an existing active direct chat between two users, or creates one for the venue.
 * Mirrors logic in POST /api/v1/chats.
 */
export async function getOrCreateDirectChat(
  admin: SupabaseClient,
  params: { userId: string; peerUserId: string; venueId: string },
): Promise<{ id: string }> {
  const { userId, peerUserId, venueId } = params;

  const { data: existingParticipants } = await admin
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId)
    .is('left_at', null);

  if (existingParticipants && existingParticipants.length > 0) {
    const chatIds = existingParticipants.map((p: { chat_id: string }) => p.chat_id);
    const { data: existingChat } = await admin
      .from('chat_participants')
      .select('chat_id, chats!inner(id, venue_id, type, is_active)')
      .eq('user_id', peerUserId)
      .in('chat_id', chatIds)
      .is('left_at', null);

    const directChat = (existingChat as { chat_id: string; chats?: { type?: string; is_active?: boolean } }[] | null | undefined)?.find(
      (p) => p.chats?.type === 'direct' && p.chats?.is_active,
    );
    if (directChat) {
      const { data: chat } = await admin
        .from('chats')
        .select('id')
        .eq('id', directChat.chat_id)
        .single();
      if (chat?.id) return { id: chat.id };
    }
  }

  const { data: chat, error: chatError } = await admin
    .from('chats')
    .insert({ venue_id: venueId, type: 'direct' })
    .select('id')
    .single();

  if (chatError || !chat) {
    throw new Error(chatError?.message || 'Failed to create chat');
  }

  await admin.from('chat_participants').insert([
    { chat_id: chat.id, user_id: userId },
    { chat_id: chat.id, user_id: peerUserId },
  ]);

  return { id: chat.id };
}
