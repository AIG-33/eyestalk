import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAllVenues, type VenueWithStats } from '@/hooks/use-venues';
import { ScreenHeader } from '@/components/ui/screen-header';
import { VENUE_EMOJI } from '@/lib/venue-constants';
import {
  nearestCity,
  cityDisplayName,
  OTHER_CITY_KEY,
  type City,
} from '@/lib/cities';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

interface CityBucket {
  key: string;
  label: string;
  count: number;
}

export default function AllVenuesScreen() {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const lang = i18n.language;

  const { data: venues, isLoading } = useAllVenues();
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  // Assign every venue to its nearest city (or the "Other" bucket) once.
  const cityByVenue = useMemo(() => {
    const map = new Map<string, City | null>();
    (venues ?? []).forEach((v) => {
      map.set(v.id, nearestCity(Number(v.latitude), Number(v.longitude)));
    });
    return map;
  }, [venues]);

  // City chips: only cities that actually have venues, most populous first.
  const cityBuckets = useMemo<CityBucket[]>(() => {
    const counts = new Map<string, { label: string; count: number }>();
    (venues ?? []).forEach((v) => {
      const city = cityByVenue.get(v.id) ?? null;
      const key = city ? city.key : OTHER_CITY_KEY;
      const label = city ? cityDisplayName(city, lang) : t('allVenues.otherCity');
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { label, count: 1 });
    });
    return Array.from(counts.entries())
      .map(([key, { label, count }]) => ({ key, label, count }))
      .sort((a, b) => {
        // Keep "Other" last, otherwise sort by count desc.
        if (a.key === OTHER_CITY_KEY) return 1;
        if (b.key === OTHER_CITY_KEY) return -1;
        return b.count - a.count;
      });
  }, [venues, cityByVenue, lang, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (venues ?? [])
      .filter((v) => {
        if (cityFilter) {
          const city = cityByVenue.get(v.id) ?? null;
          const key = city ? city.key : OTHER_CITY_KEY;
          if (key !== cityFilter) return false;
        }
        if (q) {
          const hay = `${v.name} ${v.address ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.active_checkins - a.active_checkins) || a.name.localeCompare(b.name));
  }, [venues, cityByVenue, cityFilter, search]);

  const renderItem = ({ item }: { item: VenueWithStats }) => (
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
      {item.active_checkins > 0 && (
        <View style={s.rowBadge}>
          <View style={s.rowBadgeDot} />
          <Text style={s.rowBadgeText}>{item.active_checkins}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={c.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <ScreenHeader title={t('allVenues.title')} />

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={c.text.tertiary} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('allVenues.searchPlaceholder')}
          placeholderTextColor={c.text.tertiary}
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={c.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* City filter chips */}
      {cityBuckets.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          <FilterChip
            label={t('allVenues.allCities')}
            active={cityFilter === null}
            onPress={() => setCityFilter(null)}
            s={s}
          />
          {cityBuckets.map((b) => (
            <FilterChip
              key={b.key}
              label={`${b.label} (${b.count})`}
              active={cityFilter === b.key}
              onPress={() => setCityFilter(b.key)}
              s={s}
            />
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={11}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {isLoading ? t('common.loading') : t('allVenues.empty')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function FilterChip({
  label, active, onPress, s,
}: { label: string; active: boolean; onPress: () => void; s: any }) {
  return (
    <TouchableOpacity
      style={[s.chip, active && s.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      height: 44,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor,
      backgroundColor: c.bg.secondary,
    },
    searchInput: {
      flex: 1,
      color: c.text.primary,
      fontSize: typography.size.bodyMd,
      paddingVertical: 0,
    },
    chipRow: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor,
      backgroundColor: c.bg.secondary,
    },
    chipActive: {
      borderColor: c.accent.primary,
      backgroundColor: isDark ? 'rgba(124,111,247,0.16)' : 'rgba(124,111,247,0.10)',
    },
    chipText: { color: c.text.secondary, fontSize: typography.size.bodySm },
    chipTextActive: { color: c.accent.primaryLight, fontWeight: typography.weight.semibold },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
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
    rowBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: isDark ? 'rgba(0,229,160,0.14)' : 'rgba(0,180,130,0.12)',
    },
    rowBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.accent.success,
    },
    rowBadgeText: {
      color: c.accent.success,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    empty: { alignItems: 'center', paddingTop: spacing['3xl'] },
    emptyText: { color: c.text.secondary, fontSize: typography.size.bodyMd },
  });
}
