import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useUserChats, type UserChat } from '@/hooks/use-chat';
import { markAllIncomingWavesSeen } from '@/hooks/use-chat-read';
import { useActiveCheckin } from '@/hooks/use-checkin';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { ChatListSkeleton } from '@/components/ui/skeleton';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

const VENUE_EMOJI: Record<string, string> = {
  restaurant: '🍽️', cafe: '☕', bar: '🍸', nightclub: '🪩',
  sports_bar: '⚽', karaoke: '🎤', gym: '💪', coworking: '💻',
  beauty_salon: '💅', hotel: '🏨', lounge: '🛋️', event_space: '🎪',
  food_court: '🍔', bowling: '🎳', billiards: '🎱', hookah: '💨',
  board_games: '🎲', arcade: '🕹️', standup: '🎭', live_music: '🎵',
  other: '📍',
};

export default function ChatsScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const queryClient = useQueryClient();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const { data: chats = [], isLoading, refetch, isRefetching } = useUserChats();

  useFocusEffect(
    useCallback(() => {
      void markAllIncomingWavesSeen(queryClient);
    }, [queryClient]),
  );
  const { data: activeCheckin } = useActiveCheckin();
  const session = useAuthStore((st) => st.session);
  const myId = session?.user.id;

  const sections = useMemo(() => {
    const venueChats: UserChat[] = [];
    const directActive: UserChat[] = [];
    const directOther: UserChat[] = [];

    for (const chat of chats) {
      const type = chat.chats?.type;
      if (type === 'venue_general') {
        venueChats.push(chat);
      } else if (type === 'direct') {
        const isAtSameVenue = activeCheckin &&
          chat.chats?.venue_id === activeCheckin.venue_id;
        if (isAtSameVenue) {
          directActive.push(chat);
        } else {
          directOther.push(chat);
        }
      } else {
        directOther.push(chat);
      }
    }

    const result: { title: string; key: string; data: UserChat[] }[] = [];

    if (directActive.length > 0) {
      result.push({
        title: t('chats.chatSections.active'),
        key: 'active',
        data: directActive,
      });
    }
    if (directOther.length > 0) {
      result.push({
        title: t('chats.chatSections.recent'),
        key: 'recent',
        data: directOther,
      });
    }
    if (venueChats.length > 0) {
      result.push({
        title: t('venue.chat'),
        key: 'venue',
        data: venueChats,
      });
    }

    return result;
  }, [chats, activeCheckin, t]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return t('common.yesterday', { defaultValue: 'Yesterday' });
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPreview = (chat: UserChat): string => {
    const msg = chat.last_message;
    if (!msg) return '';
    if (msg.type === 'announcement') return '📢 ' + msg.content;
    if (msg.type === 'system') return msg.content;
    const isOwn = msg.sender_id === myId;
    const prefix = isOwn ? (t('common.you', { defaultValue: 'You' }) + ': ') : '';
    return prefix + msg.content;
  };

  const handlePress = (item: UserChat) => {
    const chat = item.chats;
    if (chat?.type === 'venue_general') {
      router.push(`/(app)/venue/${chat.venue_id}/chat` as any);
    } else {
      router.push(`/(app)/chat/${chat.id}` as any);
    }
  };

  const renderItem = ({ item }: { item: UserChat }) => {
    const chat = item.chats;
    const isVenue = chat?.type === 'venue_general';
    const venueName = chat?.venues?.name || '';
    const venueType = (chat?.venues as any)?.type || 'other';
    const preview = getPreview(item);
    const time = item.last_message?.created_at || chat?.created_at;
    const unread = item.unread_count || 0;

    if (isVenue) {
      return (
        <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => handlePress(item)}>
          <View style={s.venueIconWrap}>
            <Text style={s.venueEmoji}>{VENUE_EMOJI[venueType] || '📍'}</Text>
          </View>
          <View style={s.body}>
            <View style={s.topRow}>
              <Text style={s.name} numberOfLines={1}>{venueName}</Text>
              {time && <Text style={s.time}>{formatTime(time)}</Text>}
            </View>
            <View style={s.bottomRow}>
              <Text style={[s.preview, unread > 0 && s.previewBold]} numberOfLines={1}>
                {preview || t('venue.chatHint')}
              </Text>
              {unread > 0 && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const peer = item.peer;
    return (
      <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => handlePress(item)}>
        <Avatar
          uri={peer?.avatar_url ?? null}
          name={peer?.nickname || '?'}
          size="md"
        />
        <View style={s.body}>
          <View style={s.topRow}>
            <Text style={[s.name, unread > 0 && s.nameBold]} numberOfLines={1}>{peer?.nickname || 'Chat'}</Text>
            {time && <Text style={s.time}>{formatTime(time)}</Text>}
          </View>
          <View style={s.bottomRow}>
            <Text style={[s.preview, unread > 0 && s.previewBold]} numberOfLines={1}>
              {preview || t('chats.directChatHint')}
            </Text>
            {unread > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; key: string } }) => (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t('tabs.chats')}</Text>
      </View>

      {isLoading ? (
        <View style={s.skeletonWrap}>
          {[1, 2, 3, 4, 5].map((i) => <ChatListSkeleton key={i} />)}
        </View>
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.chat_id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={s.list}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          SectionSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.accent.primary} />
          }
        />
      ) : (
        <View style={s.empty}>
          <Ionicons name="chatbubbles-outline" size={56} color={c.text.tertiary} />
          <Text style={s.emptyTitle}>{t('chats.empty')}</Text>
          <Text style={s.emptyHint}>{t('chats.emptyHint')}</Text>
          <View style={s.steps}>
            <StepRow icon="map-outline" text={t('chats.emptyStep1')} c={c} />
            <StepRow icon="qr-code-outline" text={t('chats.emptyStep2')} c={c} />
            <StepRow icon="hand-right-outline" text={t('chats.emptyStep3')} c={c} />
          </View>
        </View>
      )}
    </View>
  );
}

function StepRow({ icon, text, c }: { icon: string; text: string; c: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Ionicons name={icon as any} size={18} color={c.accent.primary} />
      <Text style={{ color: c.text.secondary, fontSize: typography.size.bodyMd, flex: 1 }}>{text}</Text>
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    },
    title: {
      fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
      color: c.text.primary, letterSpacing: typography.letterSpacing.display,
    },
    skeletonWrap: { paddingTop: spacing.md },

    list: { paddingBottom: 40 },

    sectionHeader: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    sectionTitle: {
      color: c.text.tertiary,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.caps,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
    },
    venueIconWrap: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: isDark ? 'rgba(124,111,247,0.1)' : 'rgba(108,92,231,0.06)',
      alignItems: 'center', justifyContent: 'center',
    },
    venueEmoji: { fontSize: 22 },
    body: { flex: 1, minWidth: 0 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    name: {
      color: c.text.primary,
      fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.semibold,
      flex: 1,
      marginRight: spacing.sm,
    },
    time: {
      color: c.text.tertiary,
      fontSize: typography.size.bodySm,
      flexShrink: 0,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    preview: {
      color: c.text.secondary,
      fontSize: typography.size.bodyMd,
      flex: 1,
    },
    previewBold: {
      color: c.text.primary,
      fontWeight: typography.weight.medium,
    },
    nameBold: {
      fontWeight: typography.weight.bold,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: '#FFFFFF',
      fontSize: typography.size.micro,
      fontWeight: typography.weight.bold,
    },

    separator: {
      height: 1,
      backgroundColor: borderColor,
      marginLeft: spacing.xl + 48 + spacing.md,
      marginRight: spacing.xl,
    },

    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 40, gap: spacing.md,
    },
    emptyTitle: {
      fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
      color: c.text.primary, textAlign: 'center',
    },
    emptyHint: {
      fontSize: typography.size.bodyMd, color: c.text.secondary,
      textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    },
    steps: {
      marginTop: spacing.md, gap: spacing.md, width: '100%',
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      padding: spacing.lg, borderWidth: 1, borderColor,
    },
  });
}
