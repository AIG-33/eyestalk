import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  useAnnouncementsFeed,
  type AnnouncementFeedItem,
} from '@/hooks/use-announcements-feed';
import { useTheme, typography, spacing, radius, shadows } from '@/theme';

export default function AnnouncementsScreen() {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();
  const { data: items = [], isLoading, isRefetching, refetch, error } =
    useAnnouncementsFeed();

  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const renderItem = ({ item }: { item: AnnouncementFeedItem }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: c.bg.secondary,
          borderColor,
        },
        shadows.sm,
      ]}
      activeOpacity={0.85}
      onPress={() => {
        if (item.venue_id) {
          router.push(`/(app)/venue/${item.venue_id}/chat` as any);
        }
      }}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.logoWrap,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
          ]}
        >
          {item.venue_logo_url ? (
            <Image
              source={{ uri: item.venue_logo_url }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.logoEmoji}>📢</Text>
          )}
        </View>
        <View style={styles.cardHeadText}>
          <Text style={[styles.venueName, { color: c.text.primary }]} numberOfLines={1}>
            {item.venue_name}
          </Text>
          <Text style={[styles.time, { color: c.text.tertiary }]}>
            {new Date(item.created_at).toLocaleString(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.text.tertiary} />
      </View>
      <View style={[styles.badgeRow, { backgroundColor: isDark ? 'rgba(124,111,247,0.12)' : 'rgba(108,92,231,0.08)' }]}>
        <Text style={styles.badgeIcon}>📢</Text>
        <Text style={[styles.badgeLabel, { color: c.accent.primaryLight }]}>
          {t('announcements.badge', { defaultValue: 'Announcement' })}
        </Text>
      </View>
      <Text style={[styles.body, { color: c.text.secondary }]}>{item.content}</Text>
      <Text style={[styles.hint, { color: c.text.tertiary }]}>
        {t('announcements.openChatHint', { defaultValue: 'Tap to open venue chat' })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg.primary }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(app)/map' as any)
          }
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text.primary }]}>
          {t('announcements.title', { defaultValue: 'Announcements' })}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading && !items.length ? (
        <View style={styles.centered}>
          <Text style={{ color: c.text.secondary }}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: c.accent.error }}>{t('common.error')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: spacing.md }}>
            <Text style={{ color: c.accent.primary }}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📢</Text>
          <Text style={[styles.emptyTitle, { color: c.text.primary }]}>
            {t('announcements.empty', { defaultValue: 'No announcements yet' })}
          </Text>
          <Text style={[styles.emptyHint, { color: c.text.secondary }]}>
            {t('announcements.emptyHint', {
              defaultValue:
                'When venues you follow post updates, they will appear here. Join a venue chat on the map.',
            })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={c.accent.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
  },
  list: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 44, height: 44, borderRadius: 12 },
  logoEmoji: { fontSize: 22 },
  cardHeadText: { flex: 1, minWidth: 0 },
  venueName: {
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  time: { fontSize: typography.size.micro, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeIcon: { fontSize: 12 },
  badgeLabel: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
  },
  body: {
    marginTop: spacing.md,
    fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.45,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: typography.size.micro,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: typography.size.bodyMd,
    textAlign: 'center',
    lineHeight: typography.size.bodyMd * 1.45,
  },
});
