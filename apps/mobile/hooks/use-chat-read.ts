import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const CHAT_TAB_BADGES_QUERY_KEY = ['chat-tab-badges'] as const;

export async function markChatAsRead(
  queryClient: QueryClient,
  chatId: string | null | undefined,
) {
  if (!chatId) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return;

  await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .eq('user_id', uid);

  // Both the tab badge AND the per-chat unread count in the chats list read from
  // last_read_at, so refresh both — otherwise the unread badge lingers on the
  // Chats list after opening (and reading) a conversation.
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: CHAT_TAB_BADGES_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['chats'] }),
  ]);
}

/** Clear yellow wave badge when user opens the Chats tab. */
export async function markAllIncomingWavesSeen(queryClient: QueryClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return;

  await supabase
    .from('mutual_interests')
    .update({ recipient_seen_at: new Date().toISOString() })
    .eq('to_user_id', uid)
    .eq('type', 'wave')
    .eq('is_mutual', false)
    .is('recipient_seen_at', null);

  await queryClient.invalidateQueries({ queryKey: CHAT_TAB_BADGES_QUERY_KEY });
}

/** Mark incoming waves at one venue seen when opening People there. */
export async function markVenueIncomingWavesSeen(
  queryClient: QueryClient,
  venueId: string | null | undefined,
) {
  if (!venueId) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return;

  await supabase
    .from('mutual_interests')
    .update({ recipient_seen_at: new Date().toISOString() })
    .eq('to_user_id', uid)
    .eq('venue_id', venueId)
    .eq('type', 'wave')
    .eq('is_mutual', false)
    .is('recipient_seen_at', null);

  await queryClient.invalidateQueries({ queryKey: CHAT_TAB_BADGES_QUERY_KEY });
}
