import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useMatchStore } from '@/stores/match.store';
import { supabase } from '@/lib/supabase';

export function useMatchListener() {
  const session = useAuthStore((s) => s.session);
  const showMatch = useMatchStore((s) => s.showMatch);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('match-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `type=eq.direct`,
        },
        async (payload) => {
          const chat = payload.new as any;
          const participants: string[] = chat.participant_ids || [];
          if (!participants.includes(session.user.id)) return;

          const otherId = participants.find((id: string) => id !== session.user.id);
          if (!otherId) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', otherId)
            .single();

          showMatch({
            matchedNickname: profile?.nickname || '???',
            matchedAvatar: profile?.avatar_url || null,
            chatId: chat.id,
            venueName: '',
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);
}
