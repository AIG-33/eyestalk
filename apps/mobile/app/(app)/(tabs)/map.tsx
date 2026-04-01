import { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/use-location';
import { useNearbyVenues } from '@/hooks/use-venues';
import { useActiveCheckin } from '@/hooks/use-checkin';
import { colors, typography, spacing, shadows, radius, venueAmbient } from '@/theme';
import { Card } from '@/components/ui/card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0D0D1A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0D1A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5A5A78' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161630' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5A5A78' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#161630' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5A5A78' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const VENUE_EMOJI: Record<string, string> = {
  karaoke: '🎤', nightclub: '🪩', sports_bar: '⚽', bowling: '🎳',
  billiards: '🎱', hookah: '💨', board_games: '🎲', arcade: '🕹️',
  standup: '🎭', live_music: '🎵', other: '📍',
};

export default function MapScreen() {
  const { t } = useTranslation();
  const { location } = useLocation();
  const { data: venues } = useNearbyVenues(location?.latitude ?? null, location?.longitude ?? null);
  const { data: activeCheckin } = useActiveCheckin();
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Image
            source={require('@/assets/logo-purple.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.logo}>EyesTalk</Text>
        </View>
        <View style={styles.topActions}>
          {activeCheckin && (
            <TouchableOpacity
              style={styles.activeBadge}
              onPress={() => router.push(`/(app)/venue/${activeCheckin.venue_id}` as any)}
            >
              <View style={[styles.liveDot, shadows.glowSuccess]} />
              <Text style={styles.activeBadgeText} numberOfLines={1}>
                {(activeCheckin as any).venues?.name}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/(app)/venue/check-in' as any)}
          >
            <Ionicons name="qr-code-outline" size={22} color={colors.accent.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      {location && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {venues?.map((venue) => {
            const ambient = venueAmbient[venue.type] || venueAmbient.other;
            return (
              <Marker
                key={venue.id}
                coordinate={{
                  latitude: Number(venue.latitude),
                  longitude: Number(venue.longitude),
                }}
                onPress={() => setSelectedVenue(venue.id)}
              >
                <View style={[styles.markerContainer, selectedVenue === venue.id && styles.markerSelected]}>
                  <View style={[styles.marker, { shadowColor: ambient[0] }]}>
                    <Text style={styles.markerEmoji}>
                      {VENUE_EMOJI[venue.type] || '📍'}
                    </Text>
                  </View>
                  {venue.active_checkins > 0 && (
                    <View style={[styles.markerBadge, shadows.glowSuccess]}>
                      <Text style={styles.markerBadgeText}>{venue.active_checkins}</Text>
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', colors.bg.primary]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* No venues hint */}
      {venues && venues.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyTitle}>{t('map.noVenues')}</Text>
          <Text style={styles.emptyHint}>{t('map.noVenuesHint')}</Text>
        </View>
      )}

      {/* Scroll hint */}
      {venues && venues.length > 0 && !activeCheckin && (
        <View style={styles.tapHintContainer} pointerEvents="none">
          <Text style={styles.tapHint}>{t('map.scrollVenuesHint')}</Text>
        </View>
      )}

      {/* Venue carousel */}
      {venues && venues.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            data={venues}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: spacing.xl }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const ambient = venueAmbient[item.type] || venueAmbient.other;
              return (
                <TouchableOpacity
                  style={styles.venueCard}
                  onPress={() => router.push(`/(app)/venue/${item.id}` as any)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[`${ambient[0]}20`, `${ambient[1]}10`]}
                    style={styles.venueCardGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.venueCardHeader}>
                      <Text style={styles.venueEmoji}>{VENUE_EMOJI[item.type] || '📍'}</Text>
                      {item.active_checkins > 0 && (
                        <View style={styles.liveIndicator}>
                          <View style={[styles.liveIndicatorDot, shadows.glowSuccess]} />
                          <Text style={styles.liveIndicatorText}>
                            {item.active_checkins}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.venueType}>
                      {item.type.replace('_', ' ')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* My location button */}
      <TouchableOpacity
        style={[styles.myLocationBtn, shadows.lg]}
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            });
          }
        }}
      >
        <Ionicons name="locate-outline" size={22} color={colors.accent.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  logoIcon: {
    width: 28, height: 28,
  },
  logo: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, letterSpacing: typography.letterSpacing.heading,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,229,160,0.1)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)',
    maxWidth: 160,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent.success,
  },
  activeBadgeText: {
    color: colors.accent.success, fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
  },
  scanButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,111,247,0.2)',
  },
  markerContainer: { alignItems: 'center' },
  markerSelected: { transform: [{ scale: 1.2 }] },
  marker: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12,
    elevation: 6,
  },
  markerEmoji: { fontSize: 22 },
  markerBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.accent.success, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  markerBadgeText: {
    color: '#0D0D1A', fontSize: 10, fontWeight: '800',
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
  },
  carouselContainer: {
    position: 'absolute', bottom: spacing['4xl'], left: 0, right: 0,
  },
  venueCard: {
    width: CARD_WIDTH, marginRight: 12,
  },
  venueCardGradient: {
    borderRadius: radius['2xl'], padding: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 130,
    justifyContent: 'space-between',
  },
  venueCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  venueEmoji: { fontSize: 32 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,160,0.15)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveIndicatorDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent.success,
  },
  liveIndicatorText: {
    color: colors.accent.success, fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
  },
  venueName: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
    color: colors.text.primary, marginBottom: 4,
  },
  venueType: {
    fontSize: typography.size.bodySm, color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  emptyOverlay: {
    position: 'absolute', top: '40%', left: spacing['3xl'], right: spacing['3xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
    color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
  },
  tapHintContainer: {
    position: 'absolute', bottom: spacing['4xl'] + 150, alignSelf: 'center',
  },
  tapHint: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
    backgroundColor: 'rgba(13,13,26,0.7)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.sm, overflow: 'hidden',
  },
  myLocationBtn: {
    position: 'absolute', right: spacing.xl, bottom: 240,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
});
