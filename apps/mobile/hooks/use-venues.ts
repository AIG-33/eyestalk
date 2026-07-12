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
  /** Creator of the venue. Used on the map to always show the owner their own spots. */
  owner_id?: string | null;
  /** 'standard' | 'popup' | 'community' | 'unclaimed' (imported venues awaiting an owner). */
  venue_kind?: string | null;
  /** ISO timestamp after which a pop-up event disappears (null for permanent venues). */
  expires_at?: string | null;
}

export interface VenueWithStats extends Venue {
  active_checkins: number;
  open_to_chat: number;
  /** Active+visible checked-in people whose interests match what you're looking for. */
  interest_matches: number;
}

export function useAllVenues() {
  return useQuery({
    queryKey: ['venues', 'all'],
    queryFn: async (): Promise<VenueWithStats[]> => {
      // Pop-up venues disappear after their expiry time.
      let { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      // Resilient to a DB that doesn't have expires_at yet (migration order).
      if (error) {
        const fallback = await supabase
          .from('venues')
          .select('*')
          .eq('is_active', true);
        venues = fallback.data;
        error = fallback.error;
      }

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
        interest_matches: 0,
      }));
    },
    staleTime: 30_000,
  });
}

/**
 * Per-venue count of active + visible checked-in people whose interests
 * overlap `interests` (what the viewer is looking for). Backed by the
 * `venue_interest_match_counts` RPC. Resilient: returns an empty map if the
 * RPC/column isn't deployed yet, so the map keeps working.
 */
export function useVenueMatchCounts(interests: string[]) {
  const key = [...interests].sort().join(',');
  return useQuery({
    queryKey: ['venue-match-counts', key],
    enabled: interests.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc('venue_interest_match_counts', {
        p_interests: interests,
      });

      if (error) {
        console.warn('[useVenueMatchCounts] RPC unavailable:', error.message);
        return {};
      }

      const map: Record<string, number> = {};
      (data as { venue_id: string; match_count: number }[] | null)?.forEach((row) => {
        map[row.venue_id] = Number(row.match_count) || 0;
      });
      return map;
    },
  });
}

/** @deprecated Use useAllVenues instead */
export function useNearbyVenues(lat: number | null, lng: number | null, _radiusKm: number = 5) {
  return useAllVenues();
}

/**
 * Venues owned by a given user (their created spots), newest first. This is how
 * a user gets back into a spot they made — the map only shows nearby/active
 * venues, and pop-ups vanish after they expire, so owners need a durable list.
 */
export function useMyVenues(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['venues', 'mine', ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<Venue[]> => {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, type, description, address, latitude, longitude, logo_url, cover_url, is_active, owner_id, venue_kind, expires_at, created_at')
        .eq('owner_id', ownerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Venue[]) ?? [];
    },
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
          qr_codes(code, type),
          owner:profiles!venues_owner_id_fkey(id, nickname, avatar_url, is_verified, bio)
        `)
        .eq('id', venueId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!venueId,
  });
}
