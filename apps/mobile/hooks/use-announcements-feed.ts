import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

export type AnnouncementFeedItem = {
  id: string;
  content: string;
  created_at: string;
  chat_id: string;
  venue_id: string;
  venue_name: string;
  venue_logo_url: string | null;
};

export function useAnnouncementsFeed() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['announcements-feed', session?.user.id],
    enabled: !!session,
    staleTime: 30_000,
    queryFn: async (): Promise<AnnouncementFeedItem[]> => {
      const userId = session!.user.id;

      const { data: parts, error: pe } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats!inner (
            id,
            type,
            venue_id,
            venues (name, logo_url)
          )
        `)
        .eq('user_id', userId)
        .is('left_at', null);

      if (pe) throw pe;

      const venueGeneral = (parts || []).filter(
        (p: { chats?: { type?: string } }) =>
          p.chats?.type === 'venue_general',
      );

      const chatIds = [
        ...new Set(venueGeneral.map((p: { chat_id: string }) => p.chat_id)),
      ];
      if (!chatIds.length) return [];

      const metaByChat = new Map<
        string,
        { venue_id: string; venue_name: string; venue_logo_url: string | null }
      >();

      for (const p of venueGeneral) {
        const ch = p.chats as {
          venue_id: string;
          venues?: { name?: string; logo_url?: string | null };
        };
        if (!ch?.venue_id) continue;
        const v = ch.venues;
        metaByChat.set(p.chat_id, {
          venue_id: ch.venue_id,
          venue_name: v?.name ?? 'Venue',
          venue_logo_url: v?.logo_url ?? null,
        });
      }

      const { data: msgs, error: me } = await supabase
        .from('messages')
        .select('id, content, created_at, chat_id')
        .in('chat_id', chatIds)
        .eq('type', 'announcement')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(200);

      if (me) throw me;

      return (msgs || []).map((m) => {
        const meta = metaByChat.get(m.chat_id);
        return {
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          chat_id: m.chat_id,
          venue_id: meta?.venue_id ?? '',
          venue_name: meta?.venue_name ?? 'Venue',
          venue_logo_url: meta?.venue_logo_url ?? null,
        };
      });
    },
  });
}
