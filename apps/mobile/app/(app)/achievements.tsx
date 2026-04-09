import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAchievements, useCheckAchievements } from '@/hooks/use-achievements';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme, typography, spacing, radius, shadows, type ThemeColors } from '@/theme';

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const { data: achievements = [], isLoading, refetch, isRefetching } = useAchievements();
  const checkMutation = useCheckAchievements();

  useFocusEffect(
    useCallback(() => {
      checkMutation.mutate();
    }, []),
  );

  const unlocked = achievements.filter((a) => a.is_unlocked);
  const locked = achievements.filter((a) => !a.is_unlocked);

  const renderAchievement = ({ item }: { item: (typeof achievements)[0] }) => {
    const pct = Math.min(100, Math.round((item.progress / item.threshold) * 100));
    return (
      <View style={[s.card, item.is_unlocked && s.cardUnlocked]}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>{item.icon}</Text>
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle}>
            {t(`achievements.${item.slug}`, { defaultValue: item.slug.replace(/_/g, ' ') })}
          </Text>
          <Text style={s.cardDesc}>
            {t(`achievements.${item.slug}_desc`, {
              defaultValue: `${item.progress}/${item.threshold}`,
              count: item.threshold,
            })}
          </Text>
          {!item.is_unlocked && (
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${pct}%` }]} />
            </View>
          )}
          {item.is_unlocked && item.token_reward > 0 && (
            <Text style={s.reward}>+{item.token_reward} tokens</Text>
          )}
        </View>
        {item.is_unlocked && (
          <Ionicons name="checkmark-circle" size={24} color={c.accent.success} />
        )}
      </View>
    );
  };

  const sortedData = useMemo(() => {
    const items: Array<(typeof achievements)[0] | { _sectionHeader: string }> = [];
    if (unlocked.length > 0) {
      items.push({ _sectionHeader: `${t('achievements.earned', { defaultValue: 'Earned' })} (${unlocked.length})` } as any);
      items.push(...unlocked);
    }
    if (locked.length > 0) {
      items.push({ _sectionHeader: `${t('achievements.inProgress', { defaultValue: 'In Progress' })} (${locked.length})` } as any);
      items.push(...locked);
    }
    return items;
  }, [unlocked, locked, t]);

  const ListHeader = () => (
    <LinearGradient
      colors={c.gradient.primary as unknown as [string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[s.statsCard, shadows.glowPrimary]}
    >
      <Text style={s.statsValue}>{unlocked.length}</Text>
      <Text style={s.statsLabel}>
        {t('achievements.unlocked', { defaultValue: 'Unlocked' })}
      </Text>
      <Text style={s.statsTotal}>
        {t('achievements.outOf', {
          defaultValue: 'out of {{total}}',
          total: achievements.length,
        })}
      </Text>
    </LinearGradient>
  );

  const renderItem = ({ item }: { item: any }) => {
    if (item._sectionHeader) {
      return <Text style={s.sectionTitle}>{item._sectionHeader}</Text>;
    }
    return renderAchievement({ item });
  };

  return (
    <View style={s.container}>
      <ScreenHeader title={t('achievements.title', { defaultValue: 'Achievements' })} />

      {isLoading ? (
        <View style={s.centered}>
          <Text style={{ color: c.text.secondary }}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedData}
          keyExtractor={(item: any) => item.id ?? item._sectionHeader}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.accent.primary} />
          }
        />
      )}
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    statsCard: {
      marginHorizontal: spacing.xl, padding: spacing['3xl'],
      borderRadius: radius['2xl'], alignItems: 'center', marginBottom: spacing.lg,
    },
    statsValue: {
      color: '#FFFFFF', fontSize: 56, fontWeight: typography.weight.extrabold,
      letterSpacing: typography.letterSpacing.display,
    },
    statsLabel: {
      color: 'rgba(255,255,255,0.8)', fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold, marginTop: spacing.xs,
    },
    statsTotal: {
      color: 'rgba(255,255,255,0.5)', fontSize: typography.size.bodySm, marginTop: 2,
    },
    sectionTitle: {
      color: c.text.secondary, fontSize: typography.size.label,
      fontWeight: typography.weight.semibold, textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.caps,
      paddingHorizontal: spacing.xl, marginBottom: spacing.md, marginTop: spacing.md,
    },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    card: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      padding: spacing.lg, borderWidth: 1, borderColor,
    },
    cardUnlocked: {
      borderColor: isDark ? 'rgba(0,229,160,0.2)' : 'rgba(0,180,130,0.15)',
      backgroundColor: isDark ? 'rgba(0,229,160,0.04)' : 'rgba(0,180,130,0.03)',
    },
    iconWrap: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center', justifyContent: 'center',
    },
    icon: { fontSize: 24 },
    cardBody: { flex: 1 },
    cardTitle: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold, marginBottom: 2,
    },
    cardDesc: {
      color: c.text.tertiary, fontSize: typography.size.bodySm, marginBottom: spacing.sm,
    },
    progressBarBg: {
      height: 4, borderRadius: 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    progressBarFill: {
      height: 4, borderRadius: 2,
      backgroundColor: c.accent.primary,
    },
    reward: {
      color: c.accent.success, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}
