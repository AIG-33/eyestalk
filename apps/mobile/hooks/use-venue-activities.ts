import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface VenueActivity {
  id: string;
  title: string;
  type: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
}

export function useVenueActivities(venueId: string | null) {
  return useQuery({
    queryKey: ['venue-activities', venueId],
    queryFn: async (): Promise<VenueActivity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title, type, status, starts_at, ends_at')
        .eq('venue_id', venueId!)
        .in('status', ['active', 'upcoming'])
        .order('starts_at', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!venueId,
    staleTime: 30_000,
  });
}
