import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { colors, typography, spacing, radius, shadows } from '@/theme';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  token_cost: number;
  starts_at: string;
  ends_at: string;
  config: Record<string, unknown>;
  _count?: { participants: number };
}

const ACTIVITY_EMOJI: Record<string, string> = {
  poll: '📊',
  contest: '🏆',
  tournament: '⚔️',
  challenge: '🎯',
  quest: '🗺️',
  auction: '💰',
};

export default function ActivitiesScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['venue', venueId, 'activities'],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('venue_id', venueId)
        .in('status', ['active', 'upcoming'])
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return (data as Activity[]) || [];
    },
    refetchInterval: 10_000,
  });

  const joinActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase.from('activity_participants').insert({
        activity_id: activityId,
        user_id: session!.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId, 'activities'] });
    },
  });

  const renderActivity = ({ item }: { item: Activity }) => {
    const isActive = item.status === 'active';
    const timeLeft = getTimeLeft(item.ends_at);
    const typeHint = t(`activities.types.${item.type}`, { defaultValue: '' });

    return (
      <View style={[styles.activityCard, isActive && styles.activityCardActive]}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityEmoji}>
            {ACTIVITY_EMOJI[item.type] || '🎯'}
          </Text>
          <View style={styles.activityHeaderText}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityType}>
              {item.type.replace('_', ' ')}
            </Text>
          </View>
          {isActive && timeLeft && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{timeLeft}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.activityDescription}>{item.description}</Text>
        )}

        {typeHint ? (
          <Text style={styles.typeHint}>{typeHint}</Text>
        ) : null}

        <View style={styles.activityFooter}>
          <Text style={styles.tokenCost}>
            {item.token_cost > 0
              ? t('activities.tokenCost', { cost: item.token_cost })
              : t('activities.free')}
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, shadows.glowPrimary]}
            onPress={() => joinActivity.mutate(item.id)}
            disabled={joinActivity.isPending}
          >
            <Text style={styles.joinButtonText}>
              {t('activities.join', { defaultValue: 'Join' })}
            </Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{t('activities.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hint */}
      <View style={styles.hintBanner}>
        <Ionicons name="flash-outline" size={16} color={colors.accent.warning} />
        <Text style={styles.hintText}>{t('activities.joinHint')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>{t('activities.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('activities.emptyHint')}</Text>
        </View>
      )}
    </View>
  );
}

function getTimeLeft(endDate: string): string | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  hintBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
    backgroundColor: 'rgba(255,217,61,0.06)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,217,61,0.1)',
  },
  hintText: {
    color: colors.text.secondary, fontSize: typography.size.bodySm,
    flex: 1, lineHeight: typography.size.bodySm * 1.5,
  },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  loadingText: { color: colors.text.secondary },
  emptyIcon: { fontSize: 56, marginBottom: spacing.lg },
  emptyTitle: {
    color: colors.text.primary, fontSize: typography.size.headingMd,
    fontWeight: typography.weight.bold, textAlign: 'center', marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
  },
  list: { padding: spacing.xl, gap: spacing.md },
  activityCard: {
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  activityCardActive: { borderColor: colors.accent.primary },
  activityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  activityEmoji: { fontSize: 32 },
  activityHeaderText: { flex: 1 },
  activityTitle: {
    color: colors.text.primary, fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  activityType: {
    color: colors.text.secondary, fontSize: typography.size.bodySm,
    textTransform: 'capitalize', marginTop: 2,
  },
  timerBadge: {
    backgroundColor: 'rgba(255,71,87,0.15)', paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs, borderRadius: radius.sm,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)',
  },
  timerText: {
    color: colors.accent.error, fontSize: typography.size.bodySm,
    fontWeight: typography.weight.bold,
  },
  activityDescription: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    marginTop: spacing.md, lineHeight: typography.size.bodyMd * 1.5,
  },
  typeHint: {
    color: colors.text.tertiary, fontSize: typography.size.bodySm,
    marginTop: spacing.sm, fontStyle: 'italic',
  },
  activityFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.lg,
  },
  tokenCost: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
  },
  joinButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  joinButtonText: {
    color: '#FFFFFF', fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.bold,
  },
});
