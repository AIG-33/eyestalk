import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, useTokenHistory } from '@/hooks/use-profile';
import { colors, typography, spacing, radius, shadows } from '@/theme';

export default function TokensScreen() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: transactions = [], isLoading } = useTokenHistory();

  const renderTransaction = ({ item }: { item: any }) => {
    const isPositive = item.amount > 0;
    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, {
          backgroundColor: isPositive ? 'rgba(0,229,160,0.1)' : 'rgba(255,71,87,0.1)',
        }]}>
          <Ionicons
            name={isPositive ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={isPositive ? colors.accent.success : colors.accent.error}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc}>{item.description}</Text>
          <Text style={styles.txType}>
            {t(`tokens.types.${item.type}`, { defaultValue: item.type })}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, isPositive ? styles.txPositive : styles.txNegative]}>
            {isPositive ? '+' : ''}{item.amount}
          </Text>
          <Text style={styles.txDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.tokens')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Balance card */}
      <LinearGradient
        colors={colors.gradient.primary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, shadows.glowPrimary]}
      >
        <Text style={styles.balanceLabel}>{t('tokens.balance')}</Text>
        <Text style={styles.balanceValue}>{profile?.token_balance || 0}</Text>
        <Text style={styles.balanceCurrency}>tokens</Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>{t('tokens.history')}</Text>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🪙</Text>
          <Text style={styles.emptyTitle}>{t('tokens.emptyHistory')}</Text>
          <Text style={styles.emptyText}>{t('tokens.emptyHistoryHint')}</Text>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>{t('tokens.howToEarn')}</Text>
            <Text style={styles.infoItem}>{t('tokens.earnCheckin')}</Text>
            <Text style={styles.infoItem}>{t('tokens.earnActivity')}</Text>
            <Text style={styles.infoItem}>{t('tokens.earnReferral')}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>{t('tokens.whatToSpend')}</Text>
            <Text style={styles.infoItem}>{t('tokens.spendBoost')}</Text>
            <Text style={styles.infoItem}>{t('tokens.spendExtend')}</Text>
            <Text style={styles.infoItem}>{t('tokens.spendActivity')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
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
    color: colors.text.secondary, fontSize: typography.size.label,
    fontWeight: typography.weight.semibold, textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.caps,
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txDesc: {
    color: colors.text.primary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold, marginBottom: 2,
  },
  txType: { color: colors.text.tertiary, fontSize: typography.size.bodySm },
  txRight: { alignItems: 'flex-end' },
  txAmount: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
  },
  txPositive: { color: colors.accent.success },
  txNegative: { color: colors.accent.error },
  txDate: {
    color: colors.text.tertiary, fontSize: typography.size.micro, marginTop: 2,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  loadingText: { color: colors.text.secondary },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.text.primary, fontSize: typography.size.headingMd,
    fontWeight: typography.weight.bold, marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  infoSection: {
    width: '100%', backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  infoTitle: {
    color: colors.accent.primaryLight, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.bold, marginBottom: spacing.sm,
  },
  infoItem: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.8,
  },
});
