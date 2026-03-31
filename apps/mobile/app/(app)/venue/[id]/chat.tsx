import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { subscribeToChatMessages, unsubscribe } from '@/lib/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
  sender?: { nickname: string };
}

export default function VenueChatScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const queryClient = useQueryClient();

  const { data: chatId } = useQuery({
    queryKey: ['venue', venueId, 'chat-id'],
    queryFn: async () => {
      let { data } = await supabase
        .from('chats')
        .select('id')
        .eq('venue_id', venueId)
        .eq('type', 'venue_general')
        .eq('is_active', true)
        .maybeSingle();

      if (!data) {
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert({ venue_id: venueId, type: 'venue_general' })
          .select('id')
          .single();
        if (error) throw error;
        data = newChat;
      }

      return data?.id;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['venue-chat', chatId, 'messages'],
    queryFn: async (): Promise<Message[]> => {
      if (!chatId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, type, created_at, sender:profiles!sender_id(nickname)')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data as unknown as Message[]) || [];
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (!chatId) return;

    channelRef.current = subscribeToChatMessages(chatId, () => {
      queryClient.invalidateQueries({ queryKey: ['venue-chat', chatId, 'messages'] });
    });

    return () => {
      if (channelRef.current) unsubscribe(channelRef.current);
    };
  }, [chatId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) return;
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: session!.user.id,
        content,
        type: 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
  };

  const isOwnMessage = (msg: Message) => msg.sender_id === session?.user.id;

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, isOwnMessage(item) && styles.msgRowOwn]}>
      <View style={[styles.msgBubble, isOwnMessage(item) ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
        {!isOwnMessage(item) && (
          <Text style={styles.msgSender}>{item.sender?.nickname || '???'}</Text>
        )}
        <Text style={[styles.msgText, isOwnMessage(item) && styles.msgTextOwn]}>
          {item.content}
        </Text>
        <Text style={styles.msgTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('venue.chat')}</Text>
        <Text style={styles.subtitle}>{messages.length} {t('chats.messages', { defaultValue: 'messages' })}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={t('chats.sendMessage')}
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E17' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1929',
  },
  backText: { color: '#FFFFFE', fontSize: 24 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFE' },
  subtitle: { color: '#A7A9BE', fontSize: 12 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12 },
  msgRow: { marginBottom: 8, flexDirection: 'row' },
  msgRowOwn: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '78%', borderRadius: 16, padding: 10 },
  msgBubbleOwn: { backgroundColor: '#6C5CE7', borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: '#1A1929', borderBottomLeftRadius: 4 },
  msgSender: { color: '#6C5CE7', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  msgText: { color: '#FFFFFE', fontSize: 15, lineHeight: 20 },
  msgTextOwn: { color: '#FFFFFE' },
  msgTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#1A1929',
  },
  input: {
    flex: 1, backgroundColor: '#1A1929', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: '#FFFFFE',
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: '#2A2940',
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.3 },
  sendIcon: { color: '#FFFFFE', fontSize: 20, fontWeight: '700' },
});
