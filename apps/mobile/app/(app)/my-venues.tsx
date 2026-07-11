import { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useMyVenues } from '@/hooks/use-venues';
import { useAuthStore } from '@/stores/auth.store';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Button } from '@/components/ui/button';
import { VENUE_EMOJI } from '@/lib/venue-constants';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

export default function MyVenuesScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const session = useAuthStore((st) => st.session);
  const { data: venues, isLoading } = useMyVenues(session?.user.id);

  const now = Date.now();

  const renderItem = ({ item }: { item: NonNullable<typeof venues>[number] }) => {
    const expired = !!item.expires_at && new Date(item.expires_at).getTime() < now;
    return (
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.8}
        onPress={() => router.push(`/(app)/venue/${item.id}` as any)}
      >
        <View style={s.rowEmojiWrap}>
          <Text style={s.rowEmoji}>{VENUE_EMOJI[item.type] ?? '📍'}</Text>
        </View>
        <View style={s.rowInfo}>
          <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.rowMeta} numberOfLines={1}>
            {t(`venueTypes.${item.type}`, { defaultValue: item.type })}
            {item.address ? ` · ${item.address}` : ''}
          </Text>
        </View>
        {item.venue_kind === 'popup' && (
          <View style={[s.pill, expired && s.pillMuted]}>
            <Text style={[s.pillText, expired && s.pillTextMuted]}>
              {expired ? t('myVenues.expired') : t('venue.popupBadge')}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={c.text.tertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader title={t('myVenues.title')} />
      <FlatList
        data={venues ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="location-outline" size={48} color={c.text.tertiary} />
            <Text style={s.emptyText}>
              {isLoading ? t('common.loading') : t('myVenues.empty')}
            </Text>
            {!isLoading && (
              <View style={s.emptyCta}>
                <Button
                  title={t('createVenue.menuLabel')}
                  onPress={() => router.push('/(app)/create-venue' as any)}
                />
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 120, flexGrow: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: borderColor,
    },
    rowEmojiWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(124,111,247,0.12)' : 'rgba(124,111,247,0.08)',
    },
    rowEmoji: { fontSize: 22 },
    rowInfo: { flex: 1, gap: 2 },
    rowName: {
      color: c.text.primary,
      fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.semibold,
    },
    rowMeta: { color: c.text.tertiary, fontSize: typography.size.bodySm },
    pill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,217,61,0.14)',
    },
    pillMuted: { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
    pillText: {
      color: '#D9A400',
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    pillTextMuted: { color: c.text.secondary },
    empty: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.lg },
    emptyText: {
      color: c.text.secondary,
      fontSize: typography.size.bodyMd,
      textAlign: 'center',
      paddingHorizontal: spacing['3xl'],
      lineHeight: typography.size.bodyMd * 1.5,
    },
    emptyCta: { alignSelf: 'stretch', paddingHorizontal: spacing['3xl'] },
  });
}
