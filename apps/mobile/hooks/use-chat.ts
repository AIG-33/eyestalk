import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { subscribeToChatMessages, unsubscribe } from '@/lib/realtime';
import { useAuthStore } from '@/stores/auth.store';
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

export function useChatMessages(chatId: string | null) {
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

    channelRef.current = subscribeToChatMessages(chatId, (newMsg) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat', chatId, 'messages'],
        (old) => (old ? [...old, newMsg as unknown as ChatMessage] : [newMsg as unknown as ChatMessage]),
      );
    });

    return () => {
      if (channelRef.current) unsubscribe(channelRef.current);
    };
  }, [chatId, queryClient]);

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

export function useUserChats() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats!inner(
            id, venue_id, type, name, is_active, created_at,
            venues(name)
          )
        `)
        .eq('user_id', session!.user.id)
        .is('left_at', null);

      if (error) throw error;
      const items = data || [];

      const directChats = items.filter((i: any) => i.chats?.type === 'direct');
      if (directChats.length > 0) {
        const chatIds = directChats.map((i: any) => i.chat_id);
        const { data: peers } = await supabase
          .from('chat_participants')
          .select('chat_id, user_id, profiles:user_id(nickname, avatar_url)')
          .in('chat_id', chatIds)
          .neq('user_id', session!.user.id)
          .is('left_at', null);

        const peerMap: Record<string, any> = {};
        (peers || []).forEach((p: any) => {
          peerMap[p.chat_id] = p.profiles;
        });

        return items.map((item: any) => ({
          ...item,
          peer: peerMap[item.chat_id] || null,
        }));
      }

      return items;
    },
    enabled: !!session,
  });
}
