import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useCheckinStore } from '@/stores/checkin.store';
import { useAuthStore } from '@/stores/auth.store';
import type { CheckoutReason } from '@eyestalk/shared/constants';

export function useActiveCheckin() {
  const session = useAuthStore((s) => s.session);
  const { setActiveCheckin, clearCheckin } = useCheckinStore();

  return useQuery({
    queryKey: ['checkin', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*, venues(id, name, type, logo_url, latitude, longitude, geofence_radius, checkout_policy, expires_at)')
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
  const promptPostCheckin = useCheckinStore((s) => s.promptPostCheckin);

  const checkinMutation = useMutation({
    mutationFn: async (params: {
      venue_id: string;
      qr_code?: string;
      code?: string;
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
        code: params.code,
        lat: params.lat,
        lng: params.lng,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Right after joining a spot, ask the person for their status + whether
      // they want to be visible to others there (Apple 5.1.2: presence is only
      // shown after explicit opt-in — the server default is hidden).
      const checkinId = (data?.checkin as { id?: string } | undefined)?.id;
      if (checkinId) promptPostCheckin(checkinId);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (
      arg:
        | string
        | {
            checkinId: string;
            status?: 'manual_checkout' | 'geofence_checkout';
            reason?: CheckoutReason;
          },
    ) => {
      const checkinId = typeof arg === 'string' ? arg : arg.checkinId;
      const status =
        typeof arg === 'string' ? 'manual_checkout' : (arg.status ?? 'manual_checkout');
      // A manual tap has no "auto reason" to surface; anything else records why.
      const reason: CheckoutReason =
        typeof arg === 'string'
          ? 'manual'
          : (arg.reason ?? (status === 'geofence_checkout' ? 'geofence_exit' : 'manual'));
      const { error } = await supabase
        .from('checkins')
        .update({
          status,
          checked_out_at: new Date().toISOString(),
          checkout_reason: reason,
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
