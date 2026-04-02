import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
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
import { useTheme, typography, spacing, shadows, radius, type ThemeColors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_COLS = 2;
const GRID_ITEM = (SCREEN_WIDTH - spacing.xl * 2 - GRID_GAP) / GRID_COLS;

const FILTERS = ['all', 'wantToChat', 'lookingForCompany', 'playing', 'lookingForDancePartner'];

export default function PeopleScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const blockUser = useBlockUser();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

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
        style={s.gridCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/(app)/user/${item.user_id}` as any)}
        onLongPress={() => {
          Alert.alert(profile.nickname, '', [
            { text: t('safety.report'), onPress: () => setReportTarget(item.user_id) },
            { text: t('safety.block'), style: 'destructive', onPress: () => handleBlockUser(item.user_id) },
            { text: t('common.cancel'), style: 'cancel' },
          ]);
        }}
      >
        <LinearGradient
          colors={[c.bg.secondary, c.bg.primary]}
          style={s.gridCardInner}
        >
          <Avatar uri={profile.avatar_url} name={profile.nickname} size="lg" status="inVenue" />
          <Text style={s.gridName} numberOfLines={1}>{profile.nickname}</Text>
          {item.status_tag && (
            <Tag
              label={t(`status.${item.status_tag}`, { defaultValue: item.status_tag })}
              variant="intention"
            />
          )}
          {profile.interests?.slice(0, 2).map((interest: string) => (
            <Text key={interest} style={s.gridInterest}>
              {t(`interests.${interest}`, { defaultValue: interest })}
            </Text>
          ))}

          <TouchableOpacity
            style={[s.waveButton, shadows.glowPrimary]}
            onPress={() => sendInterest.mutate(item.user_id)}
          >
            <Text style={s.waveIcon}>👋</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: any }) => {
    const profile = item.profiles;
    return (
      <View style={s.listItem}>
        <Avatar uri={profile.avatar_url} name={profile.nickname} size="md" status="inVenue" />
        <View style={s.listInfo}>
          <Text style={s.listName}>{profile.nickname}</Text>
          <View style={s.listTags}>
            {item.status_tag && (
              <Tag
                label={t(`status.${item.status_tag}`, { defaultValue: item.status_tag })}
                variant="intention"
              />
            )}
          </View>
        </View>
        <View style={s.listActions}>
          <TouchableOpacity
            style={s.listWaveBtn}
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
            <Ionicons name="ellipsis-horizontal" size={20} color={c.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.title}>{t('venue.people')}</Text>
        <View style={s.headerRight}>
          <Text style={s.count}>{filteredPeople.length}</Text>
          <TouchableOpacity
            style={s.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={20} color={c.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterScroll}
      >
        {FILTERS.map((f) => (
          <Tag
            key={f}
            label={f === 'all' ? (t('common.cancel') === 'Отмена' ? 'Все' : 'All') : t(`status.${f}`, { defaultValue: f })}
            variant="filter"
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      {/* People */}
      {/* Wave explanation */}
      <View style={s.waveExplain}>
        <Text style={s.waveExplainText}>{t('venue.waveExplain')}</Text>
      </View>

      {isLoading ? (
        <View style={s.gridContainer}>
          <View style={s.gridRow}>
            {[1, 2, 3, 4].map((i) => (
              <PersonCardSkeleton key={i} />
            ))}
          </View>
        </View>
      ) : filteredPeople.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>👀</Text>
          <Text style={s.emptyTitle}>{t('people.emptyTitle')}</Text>
          <Text style={s.emptyText}>{t('people.emptyHint')}</Text>
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          data={filteredPeople}
          numColumns={GRID_COLS}
          keyExtractor={(item: any) => item.id}
          renderItem={renderGridItem}
          columnWrapperStyle={s.gridRow}
          contentContainerStyle={s.gridContainer}
        />
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item: any) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={s.listContainer}
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
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const waveExplainBg = `${c.accent.primary}0F`;
  const waveExplainBorder = `${c.accent.primary}1A`;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
      borderBottomWidth: 1, borderBottomColor: borderColorFaint,
      gap: spacing.sm,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: borderColorFaint,
    },
    title: {
      flex: 1,
      fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
      color: c.text.primary,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    count: {
      fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
      color: c.accent.primary,
    },
    viewToggle: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: borderColor,
    },
    filterScroll: { flexGrow: 0, marginBottom: spacing.md },
    filterRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.sm },
    gridContainer: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },
    gridCard: {
      width: GRID_ITEM, borderRadius: radius.xl, overflow: 'hidden',
      borderWidth: 1, borderColor: borderColor,
    },
    gridCardInner: {
      alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md,
      gap: spacing.sm, minHeight: 200,
    },
    gridName: {
      fontSize: typography.size.headingSm, fontWeight: typography.weight.bold,
      color: c.text.primary,
    },
    gridInterest: {
      fontSize: typography.size.bodySm, color: c.text.tertiary,
    },
    waveButton: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.accent.primary, alignItems: 'center', justifyContent: 'center',
      marginTop: spacing.sm,
    },
    waveIcon: { fontSize: 22 },
    listContainer: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    listItem: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      padding: spacing.lg, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: borderColor,
    },
    listInfo: { flex: 1, gap: 4 },
    listName: {
      fontSize: typography.size.headingSm, fontWeight: typography.weight.bold,
      color: c.text.primary,
    },
    listTags: { flexDirection: 'row', gap: 6 },
    listActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    listWaveBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.glow.primarySubtle, alignItems: 'center', justifyContent: 'center',
    },
    waveExplain: {
      marginHorizontal: spacing.xl, marginBottom: spacing.md,
      backgroundColor: waveExplainBg, borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: waveExplainBorder,
    },
    waveExplainText: {
      color: c.text.secondary, fontSize: typography.size.bodySm,
      lineHeight: typography.size.bodySm * 1.5, textAlign: 'center',
    },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['3xl'],
    },
    emptyEmoji: { fontSize: 56, marginBottom: spacing.lg },
    emptyTitle: {
      color: c.text.primary, fontSize: typography.size.headingMd,
      fontWeight: typography.weight.bold, marginBottom: spacing.sm, textAlign: 'center',
    },
    emptyText: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    },
  });
}
