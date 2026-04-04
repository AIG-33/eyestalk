import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, radius, spacing, shadows } from '@/theme';
import { VENUE_EMOJI } from '@/lib/venue-constants';
import { getDistanceMeters, formatDistance } from '@/lib/geo';
import type { VenueWithStats } from '@/hooks/use-venues';

interface UserLocation {
  latitude: number;
  longitude: number;
}

/** Card width + horizontal gap between cards (for snap interval). */
const CARD_WIDTH = 104;
const CARD_GAP = 8;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface Props {
  venues: VenueWithStats[] | undefined;
  userLocation: UserLocation | null;
  activeCheckin: any;
  /** Distance from bottom of map tab content (0 = flush with tab bar seam). */
  bottomOffset: number;
  onSelectVenue: (venue: VenueWithStats) => void;
}

export function NearbyVenueCards({
  venues,
  userLocation,
  activeCheckin,
  bottomOffset,
  onSelectVenue,
}: Props) {
  const { i18n } = useTranslation();
  const { c, isDark } = useTheme();

  const sortedVenues = useMemo(() => {
    if (!venues?.length) return [];
    if (!userLocation) {
      return [...venues].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...venues].sort((a, b) => {
      const distA = getDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        Number(a.latitude),
        Number(a.longitude),
      );
      const distB = getDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        Number(b.latitude),
        Number(b.longitude),
      );
      return distA - distB;
    });
  }, [venues, userLocation]);

  if (!sortedVenues.length) return null;

  const renderCard = ({ item }: { item: VenueWithStats }) => {
    const emoji = VENUE_EMOJI[item.type] || '📍';
    const dist = userLocation
      ? formatDistance(
          getDistanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            Number(item.latitude),
            Number(item.longitude),
          ),
          i18n.language,
        )
      : null;
    const isHere =
      String(activeCheckin?.venue_id ?? '') === String(item.id ?? '');

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onSelectVenue(item)}
        style={[
          styles.card,
          {
            width: CARD_WIDTH,
            marginRight: CARD_GAP,
            backgroundColor: isDark
              ? 'rgba(22,22,48,0.94)'
              : 'rgba(255,255,255,0.96)',
            borderColor: isHere
              ? 'rgba(0,229,160,0.45)'
              : isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <View
          style={[
            styles.cardIcon,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          {item.logo_url ? (
            <Image
              source={{ uri: item.logo_url }}
              style={styles.cardLogo}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.cardEmoji}>{emoji}</Text>
          )}
        </View>

        <Text
          style={[styles.cardName, { color: c.text.primary }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <View style={styles.cardMeta}>
          {item.active_checkins > 0 && (
            <View style={styles.cardLive}>
              <View style={styles.cardLiveDot} />
              <Text style={styles.cardLiveText}>{item.active_checkins}</Text>
            </View>
          )}
          {dist ? (
            <View style={styles.cardDist}>
              <Ionicons name="navigate-outline" size={9} color={c.text.tertiary} />
              <Text style={[styles.cardDistText, { color: c.text.tertiary }]}>
                {dist}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <FlatList
        data={sortedVenues}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.985}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.list}
        {...(Platform.OS === 'ios'
          ? {
              contentInsetAdjustmentBehavior: 'never' as const,
              contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
              scrollIndicatorInsets: { top: 0, left: 0, bottom: 0, right: 0 },
            }
          : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    paddingTop: 0,
  },
  card: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  cardLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  cardEmoji: {
    fontSize: 15,
  },
  cardName: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    lineHeight: typography.size.micro * 1.25,
    minHeight: typography.size.micro * 2.5,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  cardLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E5A0',
  },
  cardLiveText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: '#00E5A0',
  },
  cardDist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardDistText: {
    fontSize: typography.size.micro,
  },
});
