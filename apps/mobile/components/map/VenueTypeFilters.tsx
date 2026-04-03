import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, typography, radius, spacing } from '@/theme';
import { VENUE_EMOJI, VENUE_TYPE_KEYS } from '@/lib/venue-constants';
import type { VenueWithStats } from '@/hooks/use-venues';

interface Props {
  venues: VenueWithStats[] | undefined;
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
}

export function VenueTypeFilters({ venues, selectedType, onSelectType }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    venues?.forEach((v) => {
      counts[v.type] = (counts[v.type] || 0) + 1;
    });
    return counts;
  }, [venues]);

  const visibleTypes = VENUE_TYPE_KEYS.filter((k) => typeCounts[k]);
  if (visibleTypes.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <TouchableOpacity
        onPress={() => onSelectType(null)}
        style={[
          styles.chip,
          {
            backgroundColor: !selectedType
              ? c.tag.filterActive.bg
              : c.tag.filter.bg,
            borderColor: !selectedType
              ? c.tag.filterActive.bg
              : c.tag.filter.border,
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: !selectedType
                ? c.tag.filterActive.text
                : c.tag.filter.text,
            },
          ]}
        >
          {t('map.allTypes', { defaultValue: 'All' })} ({venues?.length || 0})
        </Text>
      </TouchableOpacity>

      {visibleTypes.map((type) => {
        const active = selectedType === type;
        return (
          <TouchableOpacity
            key={type}
            onPress={() => onSelectType(active ? null : type)}
            style={[
              styles.chip,
              {
                backgroundColor: active
                  ? c.tag.filterActive.bg
                  : c.tag.filter.bg,
                borderColor: active
                  ? c.tag.filterActive.bg
                  : c.tag.filter.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: active
                    ? c.tag.filterActive.text
                    : c.tag.filter.text,
                },
              ]}
            >
              {VENUE_EMOJI[type]} {t(`venueTypes.${type}`, { defaultValue: type.replace('_', ' ') })}{' '}
              ({typeCounts[type]})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
  },
});
