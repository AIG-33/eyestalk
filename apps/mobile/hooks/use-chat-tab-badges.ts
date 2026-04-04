import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { CHAT_TAB_BADGES_QUERY_KEY } from '@/hooks/use-chat-read';

export type ChatTabBadges = {
  unreadMessages: number;
  unreadWaves: number;
};

export function useChatTabBadges() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: [...CHAT_TAB_BADGES_QUERY_KEY, session?.user.id],
    enabled: !!session,
    staleTime: 5_000,
    refetchInterval: 15_000,
    queryFn: async (): Promise<ChatTabBadges> => {
      const uid = session!.user.id;

      const [rpcRes, waveRes] = await Promise.all([
        supabase.rpc('my_unread_message_count'),
        supabase
          .from('mutual_interests')
          .select('id', { count: 'exact', head: true })
          .eq('to_user_id', uid)
          .eq('type', 'wave')
          .eq('is_mutual', false)
          .is('recipient_seen_at', null),
      ]);

      if (rpcRes.error) {
        console.warn('[chat-tab-badges] rpc', rpcRes.error.message);
      }

      const unreadMessages = Number(rpcRes.data ?? 0) || 0;
      const unreadWaves = waveRes.count ?? 0;

      return { unreadMessages, unreadWaves };
    },
  });
}
