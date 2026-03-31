import { useEffect, useRef, useState } from 'react';
import { subscribeToVenuePresence, unsubscribe } from '@/lib/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
  nickname: string;
  status_tag?: string;
}

export function useVenuePresence(
  venueId: string | null,
  userId: string | null,
  userInfo: PresenceUser | null,
) {
  const [presentUsers, setPresentUsers] = useState<Record<string, PresenceUser[]>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!venueId || !userId || !userInfo) return;

    channelRef.current = subscribeToVenuePresence(
      venueId,
      userId,
      userInfo,
      (state) => {
        const mapped: Record<string, PresenceUser[]> = {};
        for (const [key, presences] of Object.entries(state)) {
          mapped[key] = (presences as { nickname: string; status_tag?: string }[]).map((p) => ({
            nickname: p.nickname,
            status_tag: p.status_tag,
          }));
        }
        setPresentUsers(mapped);
      },
    );

    return () => {
      if (channelRef.current) unsubscribe(channelRef.current);
    };
  }, [venueId, userId, userInfo]);

  const userCount = Object.keys(presentUsers).length;

  return { presentUsers, userCount };
}
