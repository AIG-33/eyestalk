import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { subscribeToChatMessages, unsubscribe } from '@/lib/realtime';
import { useAuthStore } from '@/stores/auth.store';
import { markChatAsRead } from '@/hooks/use-chat-read';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
  sender?: {
    nickname: string;
    avatar_url: string | null;
  };
}

export function useChatMessages(
  chatId: string | null,
  screenFocusedRef?: MutableRefObject<boolean>,
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const query = useQuery({
    queryKey: ['chat', chatId, 'messages'],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!chatId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(nickname, avatar_url)')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data as ChatMessage[]) || [];
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (!chatId) return;

    try {
      channelRef.current = subscribeToChatMessages(chatId, (newMsg) => {
        queryClient.setQueryData<ChatMessage[]>(
          ['chat', chatId, 'messages'],
          (old) => (old ? [...old, newMsg as unknown as ChatMessage] : [newMsg as unknown as ChatMessage]),
        );
        if (screenFocusedRef?.current) {
          void markChatAsRead(queryClient, chatId);
        }
      });
    } catch (e) {
      console.warn('[use-chat] realtime subscribe failed, retrying', e);
      setTimeout(() => {
        try {
          channelRef.current = subscribeToChatMessages(chatId, (newMsg) => {
            queryClient.setQueryData<ChatMessage[]>(
              ['chat', chatId, 'messages'],
              (old) => (old ? [...old, newMsg as unknown as ChatMessage] : [newMsg as unknown as ChatMessage]),
            );
          });
        } catch {
          // give up silently — messages will still load via polling
        }
      }, 500);
    }

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, queryClient, screenFocusedRef]);

  return query;
}

export function useSendMessage(chatId: string) {
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: session!.user.id,
        content,
        type: 'text',
      });
      if (error) throw error;
    },
  });
}

export interface UserChat {
  chat_id: string;
  chats: {
    id: string;
    venue_id: string;
    type: string;
    name: string | null;
    is_active: boolean;
    created_at: string;
    venues: { name: string; type: string } | null;
  };
  peer: { nickname: string; avatar_url: string | null } | null;
  last_message: { content: string; created_at: string; sender_id: string; type: string } | null;
}

export function useUserChats() {
  const session = useAuthStore((s) => s.session);

  return useQuery<UserChat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats!inner(
            id, venue_id, type, name, is_active, created_at,
            venues(name, type)
          )
        `)
        .eq('user_id', session!.user.id)
        .is('left_at', null);

      if (error) throw error;
      const items = data || [];
      if (!items.length) return [];

      const allChatIds = items.map((i: any) => i.chat_id);

      const [peersResult, lastMsgsResult] = await Promise.all([
        supabase
          .from('chat_participants')
          .select('chat_id, user_id, profiles:user_id(nickname, avatar_url)')
          .in('chat_id', allChatIds)
          .neq('user_id', session!.user.id)
          .is('left_at', null),
        supabase
          .from('messages')
          .select('chat_id, content, created_at, sender_id, type')
          .in('chat_id', allChatIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false }),
      ]);

      const peerMap: Record<string, any> = {};
      (peersResult.data || []).forEach((p: any) => {
        if (!peerMap[p.chat_id]) peerMap[p.chat_id] = p.profiles;
      });

      const lastMsgMap: Record<string, any> = {};
      (lastMsgsResult.data || []).forEach((m: any) => {
        if (!lastMsgMap[m.chat_id]) lastMsgMap[m.chat_id] = m;
      });

      const enriched = items.map((item: any) => ({
        ...item,
        peer: peerMap[item.chat_id] || null,
        last_message: lastMsgMap[item.chat_id] || null,
      }));

      enriched.sort((a: any, b: any) => {
        const aTime = a.last_message?.created_at || a.chats?.created_at || '';
        const bTime = b.last_message?.created_at || b.chats?.created_at || '';
        return bTime.localeCompare(aTime);
      });

      return enriched as UserChat[];
    },
    enabled: !!session,
  });
}
