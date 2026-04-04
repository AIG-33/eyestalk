import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useMatchStore } from '@/stores/match.store';

export type SendWaveResult = {
  interest: unknown;
  is_mutual: boolean;
  chat_id?: string | null;
};

export function useSendWave() {
  const queryClient = useQueryClient();
  const showMatch = useMatchStore((s) => s.showMatch);

  return useMutation({
    mutationFn: async (vars: { targetUserId: string; venueId: string }) => {
      return api.post<SendWaveResult>('/interests', {
        target_user_id: vars.targetUserId,
        venue_id: vars.venueId,
        type: 'wave',
      });
    },
    onSuccess: async (data, vars) => {
      const { targetUserId, venueId } = vars;
      queryClient.invalidateQueries({ queryKey: ['sent-waves', venueId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['wave-status', venueId] });
      if (data.chat_id) {
        queryClient.invalidateQueries({ queryKey: ['chat', data.chat_id, 'messages'] });
      }
      queryClient.invalidateQueries({ queryKey: ['wave-chat-state', venueId] });
      if (data.is_mutual && data.chat_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', targetUserId)
          .single();
        const { data: venue } = await supabase
          .from('venues')
          .select('name')
          .eq('id', venueId)
          .single();
        showMatch({
          matchedNickname: profile?.nickname || '???',
          matchedAvatar: profile?.avatar_url ?? null,
          chatId: data.chat_id,
          venueName: venue?.name || '',
        });
      }
    },
  });
}
