import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { subscribeToActivityUpdates, unsubscribe } from '@/lib/realtime';
import { useAuthStore } from '@/stores/auth.store';
import type { ThemeColors } from '@/theme';
import { useTheme, typography, spacing, radius, shadows } from '@/theme';

interface PollOption {
  key: string;
  label: string;
}

interface PollConfig {
  question: string;
  options: PollOption[];
}

interface PollActivity {
  id: string;
  title: string;
  description: string | null;
  config: PollConfig;
  status: string;
  ends_at: string;
}

interface Vote {
  id: string;
  option_key: string;
  user_id: string;
}

export default function PollScreen() {
  const { id: venueId, activityId } = useLocalSearchParams<{
    id: string;
    activityId: string;
  }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async (): Promise<PollActivity> => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title, description, config, status, ends_at')
        .eq('id', activityId)
        .single();
      if (error) throw error;
      return data as PollActivity;
    },
  });

  const { data: votes = [], isLoading: loadingVotes } = useQuery({
    queryKey: ['poll-votes', activityId],
    queryFn: async (): Promise<Vote[]> => {
      const { data, error } = await supabase
        .from('votes')
        .select('id, option_key, user_id')
        .eq('activity_id', activityId);
      if (error) throw error;
      return (data as Vote[]) || [];
    },
    refetchInterval: 5_000,
  });

  const myVote = useMemo(
    () => votes.find((v) => v.user_id === session?.user.id),
    [votes, session?.user.id],
  );

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of votes) {
      counts[v.option_key] = (counts[v.option_key] || 0) + 1;
    }
    return counts;
  }, [votes]);

  const totalVotes = votes.length;

  const castVote = useMutation({
    mutationFn: async (optionKey: string) => {
      const { error } = await supabase.from('votes').insert({
        activity_id: activityId,
        user_id: session!.user.id,
        option_key: optionKey,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', activityId] });
    },
    onError: (err: any) => {
      const msg = err.message || 'Vote failed';
      Alert.alert('Vote failed', msg);
    },
  });

  useEffect(() => {
    const channel = subscribeToActivityUpdates(activityId, () => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', activityId] });
    });
    return () => unsubscribe(channel);
  }, [activityId, queryClient]);

  const isEnded =
    activity?.status === 'completed' ||
    activity?.status === 'cancelled' ||
    (activity?.ends_at && new Date(activity.ends_at) <= new Date());
  const isActive = activity?.status === 'active' && !isEnded;
  const hasVoted = !!myVote;
  const showResults = hasVoted || isEnded;

  const handleVote = () => {
    if (!selectedOption) return;
    castVote.mutate(selectedOption);
  };

  if (loadingActivity || loadingVotes) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={c.accent.primary} size="large" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>Poll not found</Text>
      </View>
    );
  }

  const options = activity.config?.options || [];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace(`/(app)/venue/${venueId}/activities` as any)
          }
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          📊 {activity.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Status bar */}
      <View style={[s.statusBar, isEnded && s.statusBarEnded]}>
        <Ionicons
          name={isEnded ? 'flag' : 'pulse-outline'}
          size={16}
          color={isEnded ? c.accent.error : c.accent.success}
        />
        <Text style={[s.statusText, isEnded && s.statusTextEnded]}>
          {isEnded ? 'Poll ended' : 'Live'}
        </Text>
        <Text style={s.voteCountBadge}>
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
        {isActive && <View style={s.liveDot} />}
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Question */}
        <View style={s.questionCard}>
          <Text style={s.questionText}>{activity.config.question}</Text>
          {activity.description && (
            <Text style={s.descriptionText}>{activity.description}</Text>
          )}
        </View>

        {/* Options */}
        {options.map((option) => {
          const count = voteCounts[option.key] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = myVote?.option_key === option.key;
          const isSelected = selectedOption === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                s.optionCard,
                isSelected && s.optionCardSelected,
                isMyVote && s.optionCardVoted,
              ]}
              onPress={() => {
                if (!hasVoted && isActive) setSelectedOption(option.key);
              }}
              disabled={hasVoted || !isActive}
              activeOpacity={hasVoted || !isActive ? 1 : 0.7}
            >
              {showResults && (
                <View
                  style={[
                    s.optionBar,
                    { width: `${pct}%` },
                    isMyVote && s.optionBarVoted,
                  ]}
                />
              )}
              <View style={s.optionContent}>
                <View style={s.optionLeft}>
                  {!hasVoted && isActive ? (
                    <View style={[s.radio, isSelected && s.radioSelected]}>
                      {isSelected && <View style={s.radioDot} />}
                    </View>
                  ) : isMyVote ? (
                    <Ionicons name="checkmark-circle" size={22} color={c.accent.primary} />
                  ) : null}
                  <Text style={[s.optionLabel, isMyVote && s.optionLabelVoted]}>
                    {option.label}
                  </Text>
                </View>
                {showResults && (
                  <View style={s.optionRight}>
                    <Text style={[s.optionPct, isMyVote && s.optionPctVoted]}>
                      {pct}%
                    </Text>
                    <Text style={s.optionCount}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {hasVoted && (
          <View style={s.votedBanner}>
            <Ionicons name="checkmark-circle" size={18} color={c.accent.success} />
            <Text style={s.votedText}>
              You voted for "{options.find((o) => o.key === myVote?.option_key)?.label}"
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Vote button */}
      {isActive && !hasVoted && (
        <View style={s.votePanel}>
          <TouchableOpacity
            style={[
              s.voteButton,
              !selectedOption && s.voteButtonDisabled,
              selectedOption ? shadows.glowPrimary : {},
            ]}
            onPress={handleVote}
            disabled={!selectedOption || castVote.isPending}
          >
            {castVote.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={s.voteButtonText}>
                {selectedOption ? 'Cast Vote' : 'Select an option'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    centered: {
      flex: 1, backgroundColor: c.bg.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    errorText: { color: c.text.secondary, fontSize: typography.size.bodyMd },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
      color: c.text.primary, marginHorizontal: spacing.sm,
    },

    statusBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, marginHorizontal: spacing.xl, marginBottom: spacing.md,
      backgroundColor: 'rgba(0,229,160,0.08)', borderRadius: radius.md,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
      borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
    },
    statusBarEnded: {
      backgroundColor: 'rgba(255,71,87,0.08)',
      borderColor: 'rgba(255,71,87,0.15)',
    },
    statusText: {
      color: c.accent.success, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold,
    },
    statusTextEnded: { color: c.accent.error },
    voteCountBadge: {
      color: c.text.secondary, fontSize: typography.size.bodySm,
      marginLeft: spacing.xs,
    },
    liveDot: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent.success,
    },

    content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['4xl'] },

    questionCard: {
      backgroundColor: c.bg.secondary, borderRadius: radius.xl,
      padding: spacing.xl, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: borderColor,
    },
    questionText: {
      color: c.text.primary, fontSize: typography.size.headingSm,
      fontWeight: typography.weight.bold, lineHeight: typography.size.headingSm * 1.4,
    },
    descriptionText: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      marginTop: spacing.sm, lineHeight: typography.size.bodyMd * 1.5,
    },

    optionCard: {
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      overflow: 'hidden', borderWidth: 1.5,
      borderColor: borderColor,
    },
    optionCardSelected: {
      borderColor: c.accent.primary,
    },
    optionCardVoted: {
      borderColor: 'rgba(124,111,247,0.3)',
    },
    optionBar: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      backgroundColor: borderColorFaint, borderRadius: radius.lg,
    },
    optionBarVoted: {
      backgroundColor: 'rgba(124,111,247,0.12)',
    },
    optionContent: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    optionRight: { alignItems: 'flex-end', marginLeft: spacing.md },

    radio: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: c.text.tertiary,
      alignItems: 'center', justifyContent: 'center',
    },
    radioSelected: { borderColor: c.accent.primary },
    radioDot: {
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: c.accent.primary,
    },

    optionLabel: {
      color: c.text.primary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.semibold, flex: 1,
    },
    optionLabelVoted: { color: c.accent.primaryLight },

    optionPct: {
      color: c.text.primary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
    optionPctVoted: { color: c.accent.primaryLight },
    optionCount: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
      marginTop: 1,
    },

    votedBanner: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: 'rgba(0,229,160,0.08)', borderRadius: radius.md,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
      marginTop: spacing.sm,
    },
    votedText: {
      color: c.accent.success, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold, flex: 1,
    },

    votePanel: {
      paddingHorizontal: spacing.xl, paddingTop: spacing.md,
      paddingBottom: spacing['4xl'],
      borderTopWidth: 1, borderTopColor: borderColor,
      backgroundColor: c.bg.primary,
    },
    voteButton: {
      height: 56, borderRadius: radius.lg,
      backgroundColor: c.accent.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    voteButtonDisabled: {
      backgroundColor: c.bg.surface,
    },
    voteButtonText: {
      color: '#FFF', fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
  });
}
