import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { subscribeToChatMessages, unsubscribe } from '@/lib/realtime';
import { ReportModal, useBlockUser } from '@/components/ui/report-modal';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';
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
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const [text, setText] = useState('');
  const [reportTarget, setReportTarget] = useState<{
    userId: string;
    messageId: string;
  } | null>(null);
  const blockUser = useBlockUser();
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const queryClient = useQueryClient();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const { data: venueInfo } = useQuery({
    queryKey: ['venue', venueId, 'owner-info'],
    queryFn: async () => {
      const { data } = await supabase
        .from('venues')
        .select('owner_id, name')
        .eq('id', venueId)
        .single();
      return data as { owner_id: string; name: string } | null;
    },
  });

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
          .insert({ venue_id: venueId, type: 'venue_general', name: 'General' })
          .select('id')
          .single();
        if (error) {
          console.error('[chat] create chat error:', error);
          throw error;
        }
        data = newChat;
      }

      if (data?.id && session?.user.id) {
        await supabase
          .from('chat_participants')
          .upsert(
            { chat_id: data.id, user_id: session.user.id },
            { onConflict: 'chat_id,user_id' },
          );
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
      queryClient.invalidateQueries({ queryKey: ['venue-chat', chatId, 'messages'] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    },
    onError: (err: any) => {
      Alert.alert('Send failed', err.message || 'Unknown error');
    },
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
  };

  const isOwnMessage = (msg: Message) => msg.sender_id === session?.user.id;

  const handleMessageLongPress = (msg: Message) => {
    if (isOwnMessage(msg)) return;
    const senderName = Array.isArray(msg.sender)
      ? msg.sender[0]?.nickname
      : (msg.sender as any)?.nickname;

    Alert.alert(senderName || t('common.user'), '', [
      {
        text: t('safety.reportMessage', { defaultValue: 'Report message' }),
        onPress: () =>
          setReportTarget({ userId: msg.sender_id, messageId: msg.id }),
      },
      {
        text: t('safety.block'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('safety.blockConfirm'), '', [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('safety.block'),
              style: 'destructive',
              onPress: () => blockUser.mutate(msg.sender_id),
            },
          ]);
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const isAdminMessage = (msg: Message) =>
    venueInfo?.owner_id != null && msg.sender_id === venueInfo.owner_id;

  const renderMessage = ({ item }: { item: Message }) => {
    const own = isOwnMessage(item);
    const admin = isAdminMessage(item);
    const senderName = Array.isArray(item.sender)
      ? item.sender[0]?.nickname
      : (item.sender as any)?.nickname;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={400}
        style={[s.msgRow, own && s.msgRowOwn]}
      >
        <View style={[
          s.msgBubble,
          own ? s.msgBubbleOwn : admin ? s.msgBubbleAdmin : s.msgBubbleOther,
        ]}>
          {!own && admin && (
            <View style={s.adminLabel}>
              <Text style={s.adminStar}>⭐</Text>
              <Text style={s.adminName}>{venueInfo?.name || 'Venue'}</Text>
            </View>
          )}
          {!own && !admin && (
            <Text style={s.msgSender}>{senderName || '???'}</Text>
          )}
          <Text style={[s.msgText, admin && !own && s.adminMsgText]}>{item.content}</Text>
          <Text style={s.msgTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title} numberOfLines={1}>{t('venue.chat')}</Text>
          <Text style={s.subtitle} numberOfLines={1}>{t('chats.venueChatHint')}</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>{messages.length}</Text>
        </View>
      </View>

      {/* Empty state */}
      {messages.length === 0 && (
        <View style={s.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={c.text.tertiary} />
          <Text style={s.emptyText}>{t('chats.emptyHint', { defaultValue: 'No messages yet. Be the first to say hello!' })}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={s.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={s.input}
          placeholder={t('chats.sendMessage')}
          placeholderTextColor={c.text.tertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[s.sendButton, !text.trim() && s.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={text.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}
          />
        </TouchableOpacity>
      </View>

      {reportTarget && (
        <ReportModal
          targetUserId={reportTarget.userId}
          reportedMessageId={reportTarget.messageId}
          venueId={venueId}
          onClose={() => setReportTarget(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: borderColorFaint,
      backgroundColor: c.bg.primary,
      zIndex: 10,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: borderColorFaint,
    },
    headerCenter: { flex: 1, marginLeft: 4 },
    title: {
      fontSize: typography.size.headingSm, fontWeight: typography.weight.bold,
      color: c.text.primary,
    },
    subtitle: {
      color: c.text.tertiary, fontSize: typography.size.bodySm, marginTop: 1,
    },
    countBadge: {
      backgroundColor: c.glow.primarySubtle,
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: radius.full, minWidth: 28, alignItems: 'center',
    },
    countText: {
      color: c.accent.primaryLight, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.bold,
    },

    emptyState: {
      position: 'absolute', top: '40%', left: 0, right: 0,
      alignItems: 'center', gap: spacing.md, zIndex: 0,
      paddingHorizontal: spacing['3xl'],
    },
    emptyText: {
      color: c.text.tertiary, fontSize: typography.size.bodyMd,
      textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    },

    messageList: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      flexGrow: 1,
    },
    msgRow: { marginBottom: spacing.sm, flexDirection: 'row' },
    msgRowOwn: { justifyContent: 'flex-end' },
    msgBubble: {
      maxWidth: '80%', borderRadius: radius.xl,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    },
    msgBubbleOwn: {
      backgroundColor: c.accent.primary,
      borderBottomRightRadius: 4,
    },
    msgBubbleOther: {
      backgroundColor: c.bg.secondary,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: borderColorFaint,
    },
    msgBubbleAdmin: {
      backgroundColor: isDark ? 'rgba(124,111,247,0.12)' : 'rgba(108,92,231,0.08)',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(124,111,247,0.25)' : 'rgba(108,92,231,0.2)',
    },
    adminLabel: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      marginBottom: 3,
    },
    adminStar: {
      fontSize: 11,
    },
    adminName: {
      color: c.accent.primary,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.bold,
    },
    adminMsgText: {
      color: c.text.primary,
    },
    msgSender: {
      color: c.accent.primaryLight, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.bold, marginBottom: 3,
    },
    msgText: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.45,
    },
    msgTime: {
      color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
      fontSize: 10,
      alignSelf: 'flex-end', marginTop: 4,
    },

    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
      paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
      borderTopWidth: 1, borderTopColor: borderColorFaint,
      backgroundColor: c.bg.primary,
    },
    input: {
      flex: 1, backgroundColor: c.bg.secondary,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.lg, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      color: c.text.primary,
      fontSize: typography.size.bodyMd, maxHeight: 120,
      borderWidth: 1, borderColor: borderColor,
    },
    sendButton: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: c.accent.primary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Platform.OS === 'ios' ? 1 : 0,
    },
    sendButtonDisabled: {
      backgroundColor: isDark ? 'rgba(124,111,247,0.3)' : 'rgba(108,92,231,0.25)',
    },
  });
}
