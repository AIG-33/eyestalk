import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToVenueChat(
  venueId: string,
  onMessage: (payload: { new: Record<string, unknown> }) => void,
): RealtimeChannel {
  const channelName = `venue-chat:${venueId}`;

  const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
  if (existing) supabase.removeChannel(existing);

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${venueId}`,
      },
      (payload) => onMessage(payload as { new: Record<string, unknown> }),
    )
    .subscribe();
}

export function subscribeToVenuePresence(
  venueId: string,
  userId: string,
  userInfo: { nickname: string; status_tag?: string },
  onSync: (state: Record<string, unknown[]>) => void,
): RealtimeChannel {
  const channel = supabase.channel(`venue-presence:${venueId}`, {
    config: { presence: { key: userId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      onSync(channel.presenceState());
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userInfo);
      }
    });

  return channel;
}

export function subscribeToChatMessages(
  chatId: string,
  onMessage: (message: Record<string, unknown>) => void,
): RealtimeChannel {
  const channelName = `chat:${chatId}`;

  const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
  if (existing) supabase.removeChannel(existing);

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => onMessage(payload.new as Record<string, unknown>),
    )
    .subscribe();
}

export function subscribeToActivityUpdates(
  activityId: string,
  onUpdate: (payload: Record<string, unknown>) => void,
): RealtimeChannel {
  const channelName = `activity:${activityId}`;

  const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
  if (existing) supabase.removeChannel(existing);

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `activity_id=eq.${activityId}`,
      },
      (payload) => onUpdate(payload.new as Record<string, unknown>),
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
