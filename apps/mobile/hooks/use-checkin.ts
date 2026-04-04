import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useCheckinStore } from '@/stores/checkin.store';
import { useAuthStore } from '@/stores/auth.store';

export function useActiveCheckin() {
  const session = useAuthStore((s) => s.session);
  const { setActiveCheckin, clearCheckin } = useCheckinStore();

  return useQuery({
    queryKey: ['checkin', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*, venues(id, name, type, logo_url, latitude, longitude, geofence_radius)')
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
  const session = useAuthStore((s) => s.session);

  const checkinMutation = useMutation({
    mutationFn: async (params: {
      venue_id: string;
      qr_code?: string;
      lat: number;
      lng: number;
    }) => {
      if (!session?.user.id) throw new Error('Not authenticated');
      return api.post<{
        checkin: Record<string, unknown>;
        tokens_earned: number;
        reward_cooldown?: boolean;
      }>('/checkins', {
        venue_id: params.venue_id,
        qr_code: params.qr_code,
        lat: params.lat,
        lng: params.lng,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (
      arg: string | { checkinId: string; status?: 'manual_checkout' | 'geofence_checkout' },
    ) => {
      const checkinId = typeof arg === 'string' ? arg : arg.checkinId;
      const status =
        typeof arg === 'string' ? 'manual_checkout' : (arg.status ?? 'manual_checkout');
      const { error } = await supabase
        .from('checkins')
        .update({
          status,
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
