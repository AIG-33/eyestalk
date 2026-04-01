import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Tag } from '@/components/ui/tag';
import { ReportModal, useBlockUser } from '@/components/ui/report-modal';
import { PersonCardSkeleton } from '@/components/ui/skeleton';
import { colors, typography, spacing, shadows, radius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_COLS = 2;
const GRID_ITEM = (SCREEN_WIDTH - spacing.xl * 2 - GRID_GAP) / GRID_COLS;

const FILTERS = ['all', 'wantToChat', 'lookingForCompany', 'playing', 'lookingForDancePartner'];

export default function PeopleScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const blockUser = useBlockUser();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['venue-people', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*, profiles(*)')
        .eq('venue_id', venueId)
        .eq('status', 'active')
        .eq('is_visible', true)
        .neq('user_id', session!.user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const sendInterest = useMutation({
    mutationFn: async (targetId: string) => {
      await api('/api/v1/interests', {
        method: 'POST',
        body: { target_user_id: targetId, venue_id: venueId, type: 'wave' },
      });
    },
    onSuccess: () => Alert.alert('👋', 'Wave sent!'),
  });

  const filteredPeople = filter === 'all'
    ? people
    : people.filter((p: any) => p.status_tag === filter);

  const handleBlockUser = (userId: string) => {
    Alert.alert(t('safety.blockConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('safety.block'), style: 'destructive', onPress: () => blockUser.mutate(userId) },
    ]);
  };

  const renderGridItem = ({ item }: { item: any }) => {
    const profile = item.profiles;
    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.85}
        onLongPress={() => {
          Alert.alert(profile.nickname, '', [
            { text: t('safety.report'), onPress: () => setReportTarget(item.user_id) },
            { text: t('safety.block'), style: 'destructive', onPress: () => handleBlockUser(item.user_id) },
            { text: t('common.cancel'), style: 'cancel' },
          ]);
        }}
      >
        <LinearGradient
          colors={[colors.bg.secondary, colors.bg.primary]}
          style={styles.gridCardInner}
        >
          <Avatar uri={profile.avatar_url} name={profile.nickname} size="lg" status="inVenue" />
          <Text style={styles.gridName} numberOfLines={1}>{profile.nickname}</Text>
          {item.status_tag && (
            <Tag
              label={t(`status.${item.status_tag}`, { defaultValue: item.status_tag })}
              variant="intention"
            />
          )}
          {profile.interests?.slice(0, 2).map((interest: string) => (
            <Text key={interest} style={styles.gridInterest}>
              {t(`interests.${interest}`, { defaultValue: interest })}
            </Text>
          ))}

          <TouchableOpacity
            style={[styles.waveButton, shadows.glowPrimary]}
            onPress={() => sendInterest.mutate(item.user_id)}
          >
            <Text style={styles.waveIcon}>👋</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: any }) => {
    const profile = item.profiles;
    return (
      <View style={styles.listItem}>
        <Avatar uri={profile.avatar_url} name={profile.nickname} size="md" status="inVenue" />
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{profile.nickname}</Text>
          <View style={styles.listTags}>
            {item.status_tag && (
              <Tag
                label={t(`status.${item.status_tag}`, { defaultValue: item.status_tag })}
                variant="intention"
              />
            )}
          </View>
        </View>
        <View style={styles.listActions}>
          <TouchableOpacity
            style={styles.listWaveBtn}
            onPress={() => sendInterest.mutate(item.user_id)}
          >
            <Text style={{ fontSize: 20 }}>👋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(profile.nickname, '', [
                { text: t('safety.report'), onPress: () => setReportTarget(item.user_id) },
                { text: t('safety.block'), style: 'destructive', onPress: () => handleBlockUser(item.user_id) },
                { text: t('common.cancel'), style: 'cancel' },
              ]);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('venue.people')}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.count}>{filteredPeople.length}</Text>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={20} color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyExtractor={(item) => item}
        renderItem={({ item: f }) => (
          <Tag
            label={f === 'all' ? 'All' : t(`status.${f}`, { defaultValue: f })}
            variant="filter"
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        )}
      />

      {/* People */}
      {/* Wave explanation */}
      <View style={styles.waveExplain}>
        <Text style={styles.waveExplainText}>{t('venue.waveExplain')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {[1, 2, 3, 4].map((i) => (
              <PersonCardSkeleton key={i} />
            ))}
          </View>
        </View>
      ) : filteredPeople.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👀</Text>
          <Text style={styles.emptyTitle}>{t('people.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('people.emptyHint')}</Text>
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          data={filteredPeople}
          numColumns={GRID_COLS}
          keyExtractor={(item: any) => item.id}
          renderItem={renderGridItem}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
        />
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item: any) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContainer}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  count: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
    color: colors.accent.primary,
  },
  viewToggle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  filterRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  gridContainer: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },
  gridCard: {
    width: GRID_ITEM, borderRadius: radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  gridCardInner: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md,
    gap: spacing.sm, minHeight: 200,
  },
  gridName: {
    fontSize: typography.size.headingSm, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  gridInterest: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
  },
  waveButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm,
  },
  waveIcon: { fontSize: 22 },
  listContainer: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  listInfo: { flex: 1, gap: 4 },
  listName: {
    fontSize: typography.size.headingSm, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  listTags: { flexDirection: 'row', gap: 6 },
  listActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listWaveBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(124,111,247,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  waveExplain: {
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
    backgroundColor: 'rgba(124,111,247,0.06)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(124,111,247,0.1)',
  },
  waveExplainText: {
    color: colors.text.secondary, fontSize: typography.size.bodySm,
    lineHeight: typography.size.bodySm * 1.5, textAlign: 'center',
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['3xl'],
  },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.lg },
  emptyTitle: {
    color: colors.text.primary, fontSize: typography.size.headingMd,
    fontWeight: typography.weight.bold, marginBottom: spacing.sm, textAlign: 'center',
  },
  emptyText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
  },
});
