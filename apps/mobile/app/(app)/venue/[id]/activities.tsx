import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme, typography, spacing, radius, shadows } from '@/theme';

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
  event: '🎉',
  auction: '💰',
};

export default function ActivitiesScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['venue', venueId, 'activities'],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('venue_id', venueId)
        .in('status', ['draft', 'active'])
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return (data as Activity[]) || [];
    },
    refetchInterval: 10_000,
  });

  const { data: joinedSet = new Set<string>() } = useQuery({
    queryKey: ['venue', venueId, 'joined-activities', session?.user.id],
    queryFn: async (): Promise<Set<string>> => {
      if (!session) return new Set();
      const { data } = await supabase
        .from('activity_participants')
        .select('activity_id')
        .eq('user_id', session.user.id);
      return new Set((data || []).map((r: { activity_id: string }) => r.activity_id));
    },
    enabled: !!session,
  });

  const joinActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase.from('activity_participants').insert({
        activity_id: activityId,
        user_id: session!.user.id,
      });
      if (error) throw error;
      return activityId;
    },
    onSuccess: (_data, activityId) => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId, 'joined-activities'] });
      queryClient.invalidateQueries({ queryKey: ['venue', venueId, 'activities'] });
    },
    onError: (err: any) => {
      const msg = err.message || 'Unknown error';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        Alert.alert('Already joined', 'You are already participating in this activity');
      } else {
        Alert.alert('Join failed', msg);
      }
    },
  });

  const handleJoinAndNavigate = async (item: Activity) => {
    const alreadyJoined = joinedSet.has(item.id);

    if (item.type === 'poll') {
      if (!alreadyJoined) {
        try {
          await joinActivity.mutateAsync(item.id);
        } catch {
          return;
        }
      }
      router.push(`/(app)/venue/${venueId}/poll/${item.id}` as any);
      return;
    }

    if (!alreadyJoined) {
      joinActivity.mutate(item.id);
    } else {
      Alert.alert('Already joined', 'You are already participating in this activity');
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const isActive = item.status === 'active';
    const timeLeft = getTimeLeft(item.ends_at);
    const typeHint = t(`activities.types.${item.type}`, { defaultValue: '' });
    const isAuction = item.type === 'auction';
    const isPoll = item.type === 'poll';
    const auctionConfig = isAuction ? item.config : null;
    const alreadyJoined = joinedSet.has(item.id);

    const getButtonLabel = () => {
      if (isAuction) return isActive ? '💰 Bid' : '👀 View';
      if (isPoll) return alreadyJoined ? '📊 Vote' : '📊 Join & Vote';
      if (alreadyJoined) return '✓ Joined';
      return t('activities.join', { defaultValue: 'Join' });
    };

    return (
      <View style={[s.activityCard, isActive && s.activityCardActive]}>
        <View style={s.activityHeader}>
          <Text style={s.activityEmoji}>
            {ACTIVITY_EMOJI[item.type] || '🎯'}
          </Text>
          <View style={s.activityHeaderText}>
            <Text style={s.activityTitle}>{item.title}</Text>
            <Text style={s.activityType}>
              {item.type.replace('_', ' ')}
            </Text>
          </View>
          {isActive && timeLeft && (
            <View style={s.timerBadge}>
              <Text style={s.timerText}>{timeLeft}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={s.activityDescription}>{item.description}</Text>
        )}

        {isAuction && auctionConfig?.item_name && (
          <View style={s.auctionPreview}>
            <Text style={s.auctionItemName}>
              {auctionConfig.item_name as string}
            </Text>
            <Text style={s.auctionPrice}>
              Starting: {(auctionConfig.starting_price as number) || 0} 🪙
            </Text>
          </View>
        )}

        {typeHint ? (
          <Text style={s.typeHint}>{typeHint}</Text>
        ) : null}

        <View style={s.activityFooter}>
          <Text style={s.tokenCost}>
            {item.token_cost > 0
              ? t('activities.tokenCost', { cost: item.token_cost })
              : t('activities.free')}
          </Text>
          {isAuction ? (
            <TouchableOpacity
              style={[s.auctionButton, shadows.glowPrimary]}
              onPress={() =>
                router.push(
                  `/(app)/venue/${venueId}/auction/${item.id}` as any,
                )
              }
            >
              <Text style={s.joinButtonText}>{getButtonLabel()}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                isPoll ? s.pollButton : s.joinButton,
                alreadyJoined && !isPoll && s.joinedButton,
                shadows.glowPrimary,
              ]}
              onPress={() => handleJoinAndNavigate(item)}
              disabled={joinActivity.isPending || (alreadyJoined && !isPoll)}
            >
              <Text style={[
                s.joinButtonText,
                alreadyJoined && !isPoll && s.joinedButtonText,
              ]}>
                {getButtonLabel()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('activities.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hint */}
      <View style={s.hintBanner}>
        <Ionicons name="flash-outline" size={16} color={c.accent.warning} />
        <Text style={s.hintText}>{t('activities.joinHint')}</Text>
      </View>

      {isLoading ? (
        <View style={s.centered}>
          <Text style={s.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          contentContainerStyle={s.list}
        />
      ) : (
        <View style={s.centered}>
          <Text style={s.emptyIcon}>🎯</Text>
          <Text style={s.emptyTitle}>{t('activities.emptyTitle')}</Text>
          <Text style={s.emptyText}>{t('activities.emptyHint')}</Text>
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

import type { ThemeColors } from '@/theme';

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
      borderBottomWidth: 1, borderBottomColor: borderColorFaint,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    },
    headerTitle: {
      fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
      color: c.text.primary,
    },
    hintBanner: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      marginHorizontal: spacing.xl, marginBottom: spacing.md,
      backgroundColor: 'rgba(255,217,61,0.06)', borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: 'rgba(255,217,61,0.1)',
    },
    hintText: {
      color: c.text.secondary, fontSize: typography.size.bodySm,
      flex: 1, lineHeight: typography.size.bodySm * 1.5,
    },
    centered: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing['3xl'],
    },
    loadingText: { color: c.text.secondary },
    emptyIcon: { fontSize: 56, marginBottom: spacing.lg },
    emptyTitle: {
      color: c.text.primary, fontSize: typography.size.headingMd,
      fontWeight: typography.weight.bold, textAlign: 'center', marginBottom: spacing.sm,
    },
    emptyText: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    },
    list: { padding: spacing.xl, gap: spacing.md },
    activityCard: {
      backgroundColor: c.bg.secondary, borderRadius: radius.lg, padding: spacing.lg,
      borderWidth: 1, borderColor: borderColor,
    },
    activityCardActive: { borderColor: c.accent.primary },
    activityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    activityEmoji: { fontSize: 32 },
    activityHeaderText: { flex: 1 },
    activityTitle: {
      color: c.text.primary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
    activityType: {
      color: c.text.secondary, fontSize: typography.size.bodySm,
      textTransform: 'capitalize', marginTop: 2,
    },
    timerBadge: {
      backgroundColor: 'rgba(255,71,87,0.15)', paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs, borderRadius: radius.sm,
      borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)',
    },
    timerText: {
      color: c.accent.error, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.bold,
    },
    activityDescription: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      marginTop: spacing.md, lineHeight: typography.size.bodyMd * 1.5,
    },
    typeHint: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
      marginTop: spacing.sm, fontStyle: 'italic',
    },
    activityFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginTop: spacing.lg,
    },
    tokenCost: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
    },
    joinButton: {
      backgroundColor: c.accent.primary,
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    joinedButton: {
      backgroundColor: borderColor,
    },
    joinedButtonText: {
      color: c.text.tertiary,
    },
    pollButton: {
      backgroundColor: c.accent.primary,
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    auctionButton: {
      backgroundColor: c.accent.primary,
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    joinButtonText: {
      color: '#FFFFFF', fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold,
    },
    auctionPreview: {
      marginTop: spacing.md, backgroundColor: 'rgba(255,217,61,0.06)',
      borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: 'rgba(255,217,61,0.1)',
    },
    auctionItemName: {
      color: c.accent.warning, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold,
    },
    auctionPrice: {
      color: c.text.secondary, fontSize: typography.size.bodySm, marginTop: 2,
    },
  });
}
