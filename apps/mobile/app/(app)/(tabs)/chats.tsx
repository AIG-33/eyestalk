import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useUserChats } from '@/hooks/use-chat';
import { Avatar } from '@/components/ui/avatar';
import { ChatListSkeleton } from '@/components/ui/skeleton';
import { colors, typography, spacing, radius, shadows } from '@/theme';

export default function ChatsScreen() {
  const { t } = useTranslation();
  const { data: chats = [], isLoading } = useUserChats();

  const renderChat = ({ item }: { item: any }) => {
    const chat = item.chats;
    const venueName = chat?.venues?.name || '';
    const chatName = chat?.name || venueName || 'Chat';
    const isVenueChat = chat?.type === 'venue_general';

    return (
      <TouchableOpacity
        style={styles.chatCard}
        activeOpacity={0.7}
        onPress={() => {
          if (isVenueChat) {
            router.push(`/(app)/venue/${chat.venue_id}/chat` as any);
          } else {
            router.push(`/(app)/chat/${chat.id}` as any);
          }
        }}
      >
        <Avatar
          uri={null}
          name={isVenueChat ? '🏠' : chatName}
          size="md"
          status={isVenueChat ? 'inVenue' : 'online'}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatTop}>
            <Text style={styles.chatName} numberOfLines={1}>{chatName}</Text>
            <Text style={styles.chatTime}>now</Text>
          </View>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {isVenueChat ? `🏠 ${venueName}` : 'Tap to open'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.chats')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <ChatListSkeleton key={i} />
          ))}
        </View>
      ) : chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chat_id}
          renderItem={renderChat}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyText}>{t('chats.empty')}</Text>
          <Text style={styles.emptySubtext}>{t('chats.emptyHint')}</Text>
          <View style={styles.stepsContainer}>
            <Text style={styles.stepText}>{t('chats.emptyStep1')}</Text>
            <Text style={styles.stepText}>{t('chats.emptyStep2')}</Text>
            <Text style={styles.stepText}>{t('chats.emptyStep3')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, letterSpacing: typography.letterSpacing.display,
  },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  skeletonContainer: { paddingTop: spacing.md },
  emptyIcon: { marginBottom: spacing.xl },
  emptyText: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
    color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
  },
  stepsContainer: {
    marginTop: spacing.xl, gap: spacing.sm,
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
    padding: spacing.lg, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  stepText: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    lineHeight: typography.size.bodyMd * 1.6,
  },
  list: { paddingHorizontal: spacing.xl },
  chatCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.secondary, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  chatInfo: { flex: 1 },
  chatTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    color: colors.text.primary, fontSize: typography.size.headingSm,
    fontWeight: typography.weight.semibold, flex: 1,
  },
  chatTime: {
    color: colors.text.tertiary, fontSize: typography.size.bodySm,
    marginLeft: spacing.sm,
  },
  chatPreview: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
  },
});
