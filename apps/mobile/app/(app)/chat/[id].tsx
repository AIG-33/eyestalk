import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatMessages, useSendMessage } from '@/hooks/use-chat';
import { useGrantPhotoAccess, useRevokePhotoAccess, useProfilePhotos } from '@/hooks/use-photos';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/avatar';
import { IcebreakerBar } from '@/components/chat/icebreaker-bar';
import { MicroChatTimer } from '@/components/chat/micro-chat-timer';
import { colors, typography, spacing, shadows, radius, component } from '@/theme';

export default function DirectChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { data: messages = [] } = useChatMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const grantAccess = useGrantPhotoAccess();
  const revokeAccess = useRevokePhotoAccess();
  const { data: myPhotos = [] } = useProfilePhotos(session?.user.id);
  const hasPrivatePhotos = myPhotos.some((p) => !p.is_public);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: chatMeta } = useQuery({
    queryKey: ['chat-meta', chatId],
    queryFn: async () => {
      const { data } = await supabase
        .from('chats')
        .select('type, expires_at')
        .eq('id', chatId)
        .single();
      return data;
    },
    enabled: !!chatId,
  });

  const { data: peer } = useQuery({
    queryKey: ['chat-peer', chatId],
    queryFn: async () => {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', session!.user.id);
      if (!participants || participants.length === 0) return null;
      const peerId = participants[0].user_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('id', peerId)
        .single();
      return profile;
    },
    enabled: !!chatId && !!session,
  });

  const { data: accessGranted } = useQuery({
    queryKey: ['photo-access', session?.user.id, peer?.id],
    queryFn: async () => {
      if (!peer) return false;
      const { data } = await supabase
        .from('photo_access_grants')
        .select('id')
        .eq('owner_id', session!.user.id)
        .eq('granted_to_id', peer.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!peer && !!session,
  });

  const isMicroChat = chatMeta?.type === 'micro';
  const isFirstMessage = messages.length === 0;
  const myId = session?.user.id;

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate(text.trim());
    setText('');
  };

  const handleIcebreaker = (question: string) => {
    sendMessage.mutate(question);
  };

  const handlePhotoAccess = () => {
    if (!peer) return;
    const isRu = t('common.cancel') === 'Отмена';
    if (accessGranted) {
      Alert.alert(
        isRu ? 'Закрыть доступ к фото?' : 'Revoke photo access?',
        isRu
          ? `${peer.nickname} больше не сможет видеть ваши приватные фото`
          : `${peer.nickname} will no longer see your private photos`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: isRu ? 'Закрыть' : 'Revoke', style: 'destructive', onPress: () => revokeAccess.mutate(peer.id) },
        ],
      );
    } else {
      Alert.alert(
        isRu ? 'Открыть доступ к фото?' : 'Share private photos?',
        isRu
          ? `${peer.nickname} сможет видеть ваши приватные фото`
          : `${peer.nickname} will be able to see your private photos`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: isRu ? 'Открыть' : 'Share', onPress: () => grantAccess.mutate(peer.id) },
        ],
      );
    }
  };

  const handleOptions = () => {
    if (!peer) return;
    const isRu = t('common.cancel') === 'Отмена';
    const options: any[] = [
      {
        text: isRu ? 'Посмотреть профиль' : 'View profile',
        onPress: () => router.push(`/(app)/user/${peer.id}` as any),
      },
    ];
    if (hasPrivatePhotos) {
      options.push({
        text: accessGranted
          ? (isRu ? '🔒 Закрыть доступ к фото' : '🔒 Revoke photo access')
          : (isRu ? '🔓 Открыть доступ к фото' : '🔓 Share private photos'),
        onPress: handlePhotoAccess,
      });
    }
    options.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert(peer.nickname, '', options);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === myId;
    return (
      <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
        {!isOwn && (
          <Avatar uri={null} name={item.sender_id.charAt(0)} size="xs" />
        )}
        {isOwn ? (
          <LinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleOwn]}
          >
            <Text style={styles.bubbleText}>{item.content}</Text>
            <Text style={styles.bubbleTime}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleOther]}>
            <Text style={styles.bubbleText}>{item.content}</Text>
            <Text style={[styles.bubbleTime, { color: colors.text.tertiary }]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md }}
          onPress={() => peer && router.push(`/(app)/user/${peer.id}` as any)}
          activeOpacity={0.7}
        >
          <Avatar uri={peer?.avatar_url ?? null} name={peer?.nickname || 'C'} size="sm" status="inVenue" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{peer?.nickname || 'Chat'}</Text>
            <Text style={styles.headerStatus}>{t('map.activeNow')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleOptions}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* MicroChat timer */}
      {isMicroChat && (
        <MicroChatTimer
          expiresAt={chatMeta?.expires_at ?? null}
          messageCount={messages.length}
          onExtend={() => {/* TODO: token extend flow */}}
          extendCost={5}
        />
      )}

      {/* Ephemeral notice */}
      {!isMicroChat && (
        <View style={styles.ephemeralNotice}>
          <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.ephemeralText}>{t('chats.ephemeralNotice')}</Text>
        </View>
      )}

      {/* Icebreaker */}
      {isFirstMessage && <IcebreakerBar onSelect={handleIcebreaker} />}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t('chats.sendMessage')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.3 }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: typography.size.headingSm, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerStatus: {
    fontSize: typography.size.bodySm, color: colors.accent.success,
  },
  ephemeralNotice: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.xs,
    backgroundColor: 'rgba(90,90,120,0.1)',
  },
  ephemeralText: {
    color: colors.text.tertiary, fontSize: typography.size.micro,
  },
  messageList: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    marginBottom: spacing.sm, maxWidth: '80%',
  },
  bubbleRowOwn: {
    alignSelf: 'flex-end', flexDirection: 'row-reverse',
  },
  bubble: {
    paddingHorizontal: component.chatBubble.paddingH,
    paddingVertical: component.chatBubble.paddingV,
    maxWidth: '100%',
  },
  bubbleOwn: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: component.chatBubble.otherBg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 20,
  },
  bubbleText: {
    fontSize: typography.size.bodyMd, color: colors.text.primary,
    lineHeight: typography.size.bodyMd * 1.45,
  },
  bubbleTime: {
    fontSize: typography.size.micro, color: 'rgba(255,255,255,0.5)',
    marginTop: 4, alignSelf: 'flex-end',
  },
  inputBar: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    backgroundColor: colors.bg.tertiary, borderRadius: radius['2xl'],
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.bg.surface,
  },
  input: {
    flex: 1, fontSize: typography.size.bodyMd, color: colors.text.primary,
    maxHeight: 100, paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center',
    ...shadows.glowPrimary,
  },
});
