import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface VenuePerson {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
}

export function useVenuePeople(venueId: string | null) {
  return useQuery({
    queryKey: ['venue-people', venueId],
    queryFn: async (): Promise<VenuePerson[]> => {
      const { data, error } = await supabase
        .from('checkins')
        .select('user_id, profiles(nickname, avatar_url)')
        .eq('venue_id', venueId!)
        .eq('status', 'active')
        .limit(6);

      if (error) throw error;

      return (data || []).map((c: any) => ({
        user_id: c.user_id,
        nickname: c.profiles?.nickname || '?',
        avatar_url: c.profiles?.avatar_url || null,
      }));
    },
    enabled: !!venueId,
    staleTime: 15_000,
  });
}
