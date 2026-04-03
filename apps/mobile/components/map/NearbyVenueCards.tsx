import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
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

interface Props {
  venues: VenueWithStats[] | undefined;
  userLocation: UserLocation | null;
  activeCheckin: any;
  onSelectVenue: (venue: VenueWithStats) => void;
}

export function NearbyVenueCards({
  venues,
  userLocation,
  activeCheckin,
  onSelectVenue,
}: Props) {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();

  const sortedVenues = useMemo(() => {
    if (!venues || !userLocation) return venues || [];
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
    const isHere = activeCheckin?.venue_id === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onSelectVenue(item)}
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? 'rgba(22,22,48,0.92)'
              : 'rgba(255,255,255,0.95)',
            borderColor: isHere
              ? 'rgba(0,229,160,0.4)'
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
          numberOfLines={1}
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
          {dist && (
            <View style={styles.cardDist}>
              <Ionicons name="navigate-outline" size={10} color={c.text.tertiary} />
              <Text style={[styles.cardDistText, { color: c.text.tertiary }]}>
                {dist}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={sortedVenues}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    width: 130,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardName: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.bold,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
