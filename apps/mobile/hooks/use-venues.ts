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

interface VenueWithStats extends Venue {
  active_checkins: number;
  open_to_chat: number;
}

export function useNearbyVenues(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['venues', 'nearby', lat, lng],
    queryFn: async (): Promise<VenueWithStats[]> => {
      if (!lat || !lng) return [];

      const { data: venues, error } = await supabase
        .rpc('nearby_venues', {
          user_lat: lat,
          user_lng: lng,
          radius_km: 5,
        });

      if (error) throw error;
      if (!venues) return [];

      const venueIds = venues.map((v: Venue) => v.id);

      const { data: checkinCounts } = await supabase
        .from('checkins')
        .select('venue_id')
        .in('venue_id', venueIds)
        .eq('status', 'active');

      const countMap: Record<string, number> = {};
      const openMap: Record<string, number> = {};

      checkinCounts?.forEach((c: { venue_id: string }) => {
        countMap[c.venue_id] = (countMap[c.venue_id] || 0) + 1;
      });

      return venues.map((v: Venue) => ({
        ...v,
        active_checkins: countMap[v.id] || 0,
        open_to_chat: openMap[v.id] || 0,
      }));
    },
    enabled: lat !== null && lng !== null,
    staleTime: 30_000,
  });
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
