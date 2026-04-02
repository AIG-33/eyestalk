import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCheckinStore } from '@/stores/checkin.store';
import { useAuthStore } from '@/stores/auth.store';

const CHECKIN_DURATION_HOURS = 4;
const CHECKIN_REWARD_TOKENS = 10;

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
  const session = useAuthStore((s) => s.session);

  const checkinMutation = useMutation({
    mutationFn: async (params: {
      venue_id: string;
      qr_code?: string;
      lat: number;
      lng: number;
    }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('Not authenticated');

      console.log('[checkin] Step 1: checking existing checkin for user', userId);
      const { data: existingCheckin, error: existingErr } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingErr) throw new Error(`Check existing: ${existingErr.message}`);
      if (existingCheckin) throw new Error('Already checked in to a venue');

      console.log('[checkin] Step 2: fetching venue', params.venue_id);
      const { data: venue, error: venueErr } = await supabase
        .from('venues')
        .select('id, name, latitude, longitude, geofence_radius')
        .eq('id', params.venue_id)
        .single();

      if (venueErr) throw new Error(`Venue fetch: ${venueErr.message}`);
      if (!venue) throw new Error('Venue not found');

      console.log('[checkin] Step 3: venue found:', venue.name, 'at', venue.latitude, venue.longitude, 'radius:', venue.geofence_radius);

      if (params.qr_code) {
        const { data: qr, error: qrErr } = await supabase
          .from('qr_codes')
          .select('id')
          .eq('venue_id', params.venue_id)
          .eq('code', params.qr_code)
          .eq('is_active', true)
          .maybeSingle();

        if (qrErr) throw new Error(`QR check: ${qrErr.message}`);
        if (!qr) throw new Error('Invalid QR code');
      } else {
        const distance = getDistanceMeters(
          params.lat, params.lng,
          Number(venue.latitude), Number(venue.longitude),
        );
        const maxDist = venue.geofence_radius || 100;
        console.log('[checkin] Step 4: distance =', Math.round(distance), 'm, max =', maxDist, 'm');
        if (distance > maxDist) {
          throw new Error(`Too far from venue (${Math.round(distance)}m away, max ${maxDist}m)`);
        }
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + CHECKIN_DURATION_HOURS);

      console.log('[checkin] Step 5: inserting checkin');
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          user_id: userId,
          venue_id: params.venue_id,
          method: params.qr_code ? 'qr' : 'geofence',
          status: 'active',
          tokens_earned: CHECKIN_REWARD_TOKENS,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (checkinError) throw new Error(`Checkin insert: ${checkinError.message} (code: ${checkinError.code})`);
      console.log('[checkin] Step 6: success!', checkin);

      return { checkin, tokens_earned: CHECKIN_REWARD_TOKENS };
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

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
