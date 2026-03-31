import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCheckinStore } from '@/stores/checkin.store';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

export function useActiveCheckin() {
  const session = useAuthStore((s) => s.session);
  const { setActiveCheckin, clearCheckin } = useCheckinStore();

  return useQuery({
    queryKey: ['checkin', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*, venues(id, name, type, logo_url)')
        .eq('user_id', session!.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveCheckin(data.id, data.venue_id);
      } else {
        clearCheckin();
      }

      return data;
    },
    enabled: !!session,
    refetchInterval: 60_000,
  });
}

export function useCheckin() {
  const queryClient = useQueryClient();

  const checkinMutation = useMutation({
    mutationFn: async (params: {
      venue_id: string;
      qr_code?: string;
      lat: number;
      lng: number;
    }) => {
      return api.post<{
        checkin: Record<string, unknown>;
        tokens_earned: number;
      }>('/checkins', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (checkinId: string) => {
      const { error } = await supabase
        .from('checkins')
        .update({
          status: 'manual_checkout',
          checked_out_at: new Date().toISOString(),
        })
        .eq('id', checkinId);

      if (error) throw error;
    },
    onSuccess: () => {
      useCheckinStore.getState().clearCheckin();
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });

  return { checkinMutation, checkoutMutation };
}
