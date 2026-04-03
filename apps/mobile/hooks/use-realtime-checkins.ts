import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PULSE_DURATION_MS = 3000;

export function useRealtimeCheckins() {
  const [recentVenueIds, setRecentVenueIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('map-checkins')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins' },
        (payload) => {
          const venueId = (payload.new as any).venue_id as string | undefined;
          if (!venueId) return;

          setRecentVenueIds((prev) => new Set(prev).add(venueId));
          queryClient.invalidateQueries({ queryKey: ['venues'] });

          setTimeout(() => {
            setRecentVenueIds((prev) => {
              const next = new Set(prev);
              next.delete(venueId);
              return next;
            });
          }, PULSE_DURATION_MS);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return recentVenueIds;
}
