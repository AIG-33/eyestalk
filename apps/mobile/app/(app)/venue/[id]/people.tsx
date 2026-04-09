import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Pressable, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useSendWave } from '@/hooks/use-send-wave';
import { Avatar } from '@/components/ui/avatar';
import { Tag } from '@/components/ui/tag';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ReportModal, useBlockUser } from '@/components/ui/report-modal';
import { PersonCardSkeleton } from '@/components/ui/skeleton';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';
import { markVenueIncomingWavesSeen } from '@/hooks/use-chat-read';
import { haptic } from '@/lib/haptics';

const FILTERS = ['all', 'wantToChat', 'lookingForCompany', 'playing', 'lookingForDancePartner'];

export default function PeopleScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const [filter, setFilter] = useState('all');
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const blockUser = useBlockUser();
  const sendWave = useSendWave();
  const { c, isDark } = useTheme();
  const queryClient = useQueryClient();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const userId = session?.user?.id;

  useFocusEffect(
    useCallback(() => {
      if (venueId) void markVenueIncomingWavesSeen(queryClient, venueId);
    }, [venueId, queryClient]),
  );

  const { data: people = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['venue-people', venueId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*, profiles(*)')
        .eq('venue_id', venueId!)
        .eq('status', 'active')
        .eq('is_visible', true)
        .neq('user_id', userId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!venueId && !!userId,
  });

  const { data: sentWaves = [] } = useQuery({
    queryKey: ['sent-waves', venueId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mutual_interests')
        .select('to_user_id')
        .eq('from_user_id', userId!)
        .eq('venue_id', venueId!)
        .eq('type', 'wave');
      if (error) throw error;
      return (data || []).map((i: { to_user_id: string }) => i.to_user_id);
    },
    enabled: !!venueId && !!userId,
  });

  const handleSendWave = useCallback((targetId: string) => {
    if (!venueId) return;
    haptic.light();
    sendWave.mutate(
      { targetUserId: targetId, venueId },
      {
        onSuccess: (data) => {
          haptic.success();
          if (!data.is_mutual) {
            Alert.alert('👋', t('venue.waveSent', { defaultValue: 'Wave sent!' }));
          }
        },
        onError: (err: Error) => {
          Alert.alert(t('common.error'), err.message || t('common.error'));
        },
      },
    );
  }, [sendWave, venueId, t]);

  const filteredPeople = useMemo(() => {
    const withProfile = (people as any[]).filter((p) => p?.profiles);
    return filter === 'all'
      ? withProfile
      : withProfile.filter((p: any) => p.status_tag === filter);
  }, [people, filter]);

  const handleBlockUser = useCallback((userId: string) => {
    Alert.alert(t('safety.blockConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('safety.block'), style: 'destructive', onPress: () => blockUser.mutate(userId) },
    ]);
  }, [t, blockUser]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const profile = item.profiles;
    const nickname = profile.nickname ?? '?';
    const alreadyWaved = sentWaves.includes(item.user_id);
    const interests = (profile.interests || []).slice(0, 3);

    return (
      <View style={s.row}>
        <Pressable
          style={({ pressed }) => [s.rowMain, pressed && s.rowPressed]}
          onPress={() => router.push({ pathname: '/(app)/user/[id]' as any, params: { id: item.user_id, venueId } })}
          onLongPress={() => {
            Alert.alert(nickname, '', [
              { text: t('safety.report'), onPress: () => setReportTarget(item.user_id) },
              { text: t('safety.block'), style: 'destructive', onPress: () => handleBlockUser(item.user_id) },
              { text: t('common.cancel'), style: 'cancel' },
            ]);
          }}
        >
          <Avatar uri={profile.avatar_url ?? null} name={nickname} size="md" status="inVenue" />

          <View style={s.info}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{nickname}</Text>
              {item.status_tag && (
                <View style={s.statusBadge}>
                  <Text style={s.statusText}>
                    {t(`status.${item.status_tag}`, { defaultValue: item.status_tag })}
                  </Text>
                </View>
              )}
            </View>
            {interests.length > 0 && (
              <Text style={s.interests} numberOfLines={1}>
                {interests.map((i: string) => t(`interests.${i}`, { defaultValue: i })).join(' · ')}
              </Text>
            )}
          </View>
        </Pressable>

        <TouchableOpacity
          style={[s.waveBtn, alreadyWaved && s.waveBtnSent]}
          onPress={() => {
            if (!alreadyWaved) handleSendWave(item.user_id);
          }}
          disabled={alreadyWaved || sendWave.isPending}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={alreadyWaved ? 'checkmark' : 'hand-right-outline'}
            size={18}
            color={alreadyWaved ? c.status.success : c.accent.primary}
          />
        </TouchableOpacity>
      </View>
    );
  }, [s, c, sentWaves, sendWave.isPending, handleSendWave, t, handleBlockUser, venueId]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title={t('venue.people')}
        centered={false}
        rightAction={
          <View style={s.countBadge}>
            <Text style={s.countText}>{filteredPeople.length}</Text>
          </View>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterScroll}
      >
        {FILTERS.map((f) => (
          <Tag
            key={f}
            label={f === 'all' ? t('common.all', { defaultValue: 'All' }) : t(`status.${f}`, { defaultValue: f })}
            variant="filter"
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      {!userId ? (
        <EmptyState icon="hourglass-outline" title={t('common.loading')} />
      ) : isLoading ? (
        <View style={s.loadingWrap}>
          {[1, 2, 3, 4, 5].map((i) => (
            <PersonCardSkeleton key={i} />
          ))}
        </View>
      ) : filteredPeople.length === 0 ? (
        <EmptyState emoji="👀" title={t('people.emptyTitle')} hint={t('people.emptyHint')} />
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.accent.primary} />
          }
        />
      )}

      {reportTarget && (
        <ReportModal
          targetUserId={reportTarget}
          venueId={venueId}
          onClose={() => setReportTarget(null)}
        />
      )}
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },

    countBadge: {
      minWidth: 28, height: 28, borderRadius: 14,
      backgroundColor: `${c.accent.primary}20`,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    countText: {
      fontSize: typography.size.bodySm, fontWeight: typography.weight.bold,
      color: c.accent.primary,
    },

    filterScroll: { flexGrow: 0 },
    filterRow: {
      paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
      gap: spacing.sm,
    },

    listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 100 },

    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.bg.secondary,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      marginBottom: spacing.xs,
      borderWidth: 1, borderColor: border,
      gap: spacing.sm,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    rowPressed: { opacity: 0.92 },

    info: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: {
      fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold,
      color: c.text.primary, flexShrink: 1,
    },
    statusBadge: {
      backgroundColor: `${c.accent.primary}18`,
      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
    },
    statusText: {
      fontSize: typography.size.micro, fontWeight: typography.weight.medium,
      color: c.accent.primary,
    },
    interests: {
      fontSize: typography.size.bodySm, color: c.text.tertiary,
    },

    waveBtn: {
      width: 36, height: 36, borderRadius: 18,
      borderWidth: 1.5, borderColor: `${c.accent.primary}40`,
      alignItems: 'center', justifyContent: 'center',
    },
    waveBtnSent: {
      borderColor: `${c.status.success}40`,
      backgroundColor: `${c.status.success}10`,
    },

    loadingWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },

  });
}
