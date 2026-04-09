import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, useTokenHistory } from '@/hooks/use-profile';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme, typography, spacing, radius, shadows, type ThemeColors } from '@/theme';

export default function TokensScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: transactions = [], isLoading, refetch: refetchHistory, isRefetching: isRefetchingHistory } = useTokenHistory();

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const isRefreshing = manualRefreshing || isRefetchingHistory;
  const handleRefresh = useCallback(async () => {
    setManualRefreshing(true);
    await Promise.all([refetchProfile(), refetchHistory()]);
    setManualRefreshing(false);
  }, [refetchProfile, refetchHistory]);

  const renderTransaction = ({ item }: { item: any }) => {
    const isPositive = item.amount > 0;
    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, {
          backgroundColor: isPositive ? `${c.accent.success}1A` : `${c.accent.error}1A`,
        }]}>
          <Ionicons
            name={isPositive ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={isPositive ? c.accent.success : c.accent.error}
          />
        </View>
        <View style={s.txInfo}>
          <Text style={s.txDesc}>{item.description}</Text>
          <Text style={s.txType}>
            {t(`tokens.types.${item.type}`, { defaultValue: item.type })}
          </Text>
        </View>
        <View style={s.txRight}>
          <Text style={[s.txAmount, isPositive ? s.txPositive : s.txNegative]}>
            {isPositive ? '+' : ''}{item.amount}
          </Text>
          <Text style={s.txDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader title={t('profile.tokens')} />

      <LinearGradient
        colors={c.gradient.primary as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.balanceCard, shadows.glowPrimary]}
      >
        <Text style={s.balanceLabel}>{t('tokens.balance')}</Text>
        <Text style={s.balanceValue}>{profile?.token_balance || 0}</Text>
        <Text style={s.balanceCurrency}>tokens</Text>
      </LinearGradient>

      <Text style={s.sectionTitle}>{t('tokens.history')}</Text>

      {isLoading ? (
        <View style={s.centered}>
          <Text style={s.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.accent.primary} />
          }
        />
      ) : (
        <EmptyState emoji="🪙" title={t('tokens.emptyHistory')} hint={t('tokens.emptyHistoryHint')}>
          <View style={{ width: '100%', marginTop: spacing.xl }}>
            <View style={s.infoSection}>
              <Text style={s.infoTitle}>{t('tokens.howToEarn')}</Text>
              <Text style={s.infoItem}>{t('tokens.earnCheckin')}</Text>
              <Text style={s.infoItem}>{t('tokens.earnActivity')}</Text>
              <Text style={s.infoItem}>{t('tokens.earnReferral')}</Text>
            </View>

            <View style={s.infoSection}>
              <Text style={s.infoTitle}>{t('tokens.whatToSpend')}</Text>
              <Text style={s.infoItem}>{t('tokens.spendBoost')}</Text>
              <Text style={s.infoItem}>{t('tokens.spendExtend')}</Text>
              <Text style={s.infoItem}>{t('tokens.spendActivity')}</Text>
              <Text style={s.infoItem}>{t('tokens.spendService')}</Text>
            </View>
          </View>
        </EmptyState>
      )}
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    balanceCard: {
      marginHorizontal: spacing.xl, padding: spacing['3xl'],
      borderRadius: radius['2xl'], alignItems: 'center', marginBottom: spacing['2xl'],
    },
    balanceLabel: {
      color: 'rgba(255,255,255,0.7)', fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold, marginBottom: spacing.sm,
      textTransform: 'uppercase', letterSpacing: typography.letterSpacing.caps,
    },
    balanceValue: {
      color: '#FFFFFF', fontSize: 56, fontWeight: typography.weight.extrabold,
      letterSpacing: typography.letterSpacing.display,
    },
    balanceCurrency: {
      color: 'rgba(255,255,255,0.5)', fontSize: typography.size.bodySm, marginTop: spacing.xs,
    },
    sectionTitle: {
      color: c.text.secondary, fontSize: typography.size.label,
      fontWeight: typography.weight.semibold, textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.caps,
      paddingHorizontal: spacing.xl, marginBottom: spacing.md,
    },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    txRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      padding: spacing.lg, marginBottom: spacing.sm,
      borderWidth: 1, borderColor,
    },
    txIcon: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    txInfo: { flex: 1 },
    txDesc: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold, marginBottom: 2,
    },
    txType: { color: c.text.tertiary, fontSize: typography.size.bodySm },
    txRight: { alignItems: 'flex-end' },
    txAmount: {
      fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
    },
    txPositive: { color: c.accent.success },
    txNegative: { color: c.accent.error },
    txDate: {
      color: c.text.tertiary, fontSize: typography.size.micro, marginTop: 2,
    },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    loadingText: { color: c.text.secondary },
    infoSection: {
      width: '100%', backgroundColor: c.bg.secondary,
      borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
      borderWidth: 1, borderColor,
    },
    infoTitle: {
      color: c.accent.primaryLight, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold, marginBottom: spacing.sm,
    },
    infoItem: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.8,
    },
  });
}
