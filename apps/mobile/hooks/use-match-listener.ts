import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useMatchStore } from '@/stores/match.store';
import { supabase } from '@/lib/supabase';
import { findDirectChatId } from '@/lib/find-direct-chat';

/**
 * When the other person waves back, `mutual_interests` gets an INSERT with
 * `to_user_id = me` and `is_mutual = true`. Show the match celebration + deep link to chat.
 */
export function useMatchListener() {
  const session = useAuthStore((s) => s.session);
  const showMatch = useMatchStore((s) => s.showMatch);
  const dedupeRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('match-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mutual_interests',
          filter: `to_user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          const row = payload.new as {
            from_user_id: string;
            to_user_id: string;
            is_mutual: boolean;
            venue_id: string;
            type: string;
          };
          if (!row.is_mutual || row.type !== 'wave') return;

          const key = `${row.venue_id}:${row.from_user_id}:${row.to_user_id}`;
          if (dedupeRef.current.has(key)) return;
          dedupeRef.current.add(key);
          setTimeout(() => dedupeRef.current.delete(key), 8000);

          const otherId = row.from_user_id;
          const chatId = await findDirectChatId(supabase, session.user.id, otherId);
          if (!chatId) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', otherId)
            .single();

          let venueName = '';
          if (row.venue_id) {
            const { data: v } = await supabase
              .from('venues')
              .select('name')
              .eq('id', row.venue_id)
              .single();
            venueName = v?.name || '';
          }

          showMatch({
            matchedNickname: profile?.nickname || '???',
            matchedAvatar: profile?.avatar_url ?? null,
            chatId,
            venueName,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);
}
