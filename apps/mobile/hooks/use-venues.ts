import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Venue {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  cover_url: string | null;
  is_active: boolean;
}

export interface VenueWithStats extends Venue {
  active_checkins: number;
  open_to_chat: number;
}

export function useAllVenues() {
  return useQuery({
    queryKey: ['venues', 'all'],
    queryFn: async (): Promise<VenueWithStats[]> => {
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true);

      console.log('[useAllVenues] result:', { count: venues?.length, error: error?.message });

      if (error) {
        console.error('[useAllVenues] Supabase error:', error);
        throw error;
      }
      if (!venues || venues.length === 0) return [];

      const venueIds = venues.map((v: Venue) => v.id);

      const { data: checkinCounts } = await supabase
        .from('checkins')
        .select('venue_id')
        .in('venue_id', venueIds)
        .eq('status', 'active');

      const countMap: Record<string, number> = {};

      checkinCounts?.forEach((c: { venue_id: string }) => {
        countMap[c.venue_id] = (countMap[c.venue_id] || 0) + 1;
      });

      return venues.map((v: Venue) => ({
        ...v,
        active_checkins: countMap[v.id] || 0,
        open_to_chat: 0,
      }));
    },
    staleTime: 30_000,
  });
}

/** @deprecated Use useAllVenues instead */
export function useNearbyVenues(lat: number | null, lng: number | null, _radiusKm: number = 5) {
  return useAllVenues();
}

export function useVenueDetail(venueId: string) {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          venue_zones(*),
          qr_codes(code, type)
        `)
        .eq('id', venueId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!venueId,
  });
}
