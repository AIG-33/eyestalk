import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '@/hooks/use-location';
import { useAllVenues, type VenueWithStats } from '@/hooks/use-venues';
import { useActiveCheckin, useCheckin } from '@/hooks/use-checkin';
import { useRealtimeCheckins } from '@/hooks/use-realtime-checkins';
import { LiveVenueMarker } from '@/components/map/LiveVenueMarker';
import { VenueTypeFilters } from '@/components/map/VenueTypeFilters';
import { NearbyVenueCards } from '@/components/map/NearbyVenueCards';
import { VenueBottomSheet } from '@/components/map/VenueBottomSheet';
import {
  MapOnboarding,
  useMapOnboardingVisible,
} from '@/components/map/MapOnboarding';
import { VENUE_EMOJI } from '@/lib/venue-constants';
import {
  isLatLngInMapRegion,
  type MapRegionBounds,
} from '@/lib/geo';
import { colors, typography, spacing, shadows, radius, useTheme } from '@/theme';
import { LogoMark } from '@/components/ui/logo-mark';

/** Approx. height of compact venue carousel strip (cards + padding). */
const COMPACT_VENUE_STRIP_HEIGHT = 92;

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

const LIGHT_MAP_STYLE: any[] = [];

// Immediate map paint (Android waits for GPS otherwise). User is centered when location arrives.
const MAP_BOOT_REGION = {
  latitude: 52.2297,
  longitude: 21.0122,
  latitudeDelta: 8,
  longitudeDelta: 8,
} as const;

// ─── Pulsing checkin badge (top bar) ─────────────────────

function PulsingVenueBadge({
  checkin,
  isDark,
  c,
}: {
  checkin: any;
  isDark: boolean;
  c: any;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  const dotScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const venue = checkin.venues;
  const venueName = venue?.name || '...';
  const venueEmoji = VENUE_EMOJI[venue?.type] || '📍';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        const vid = checkin?.venue_id;
        if (!vid) return;
        router.push(`/(app)/venue/${vid}` as any);
      }}
      style={[
        styles.venueBadge,
        {
          backgroundColor: isDark
            ? 'rgba(13,13,26,0.85)'
            : 'rgba(255,255,255,0.9)',
          borderColor: isDark
            ? 'rgba(0,229,160,0.3)'
            : 'rgba(0,160,120,0.35)',
        },
      ]}
    >
      <View
        style={[
          styles.venueBadgeLogo,
          {
            backgroundColor: isDark
              ? 'rgba(0,229,160,0.15)'
              : 'rgba(0,180,130,0.15)',
          },
        ]}
      >
        {venue?.logo_url ? (
          <Image
            source={{ uri: venue.logo_url }}
            style={styles.venueBadgeLogoImg}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.venueBadgeEmoji}>{venueEmoji}</Text>
        )}
      </View>
      <View style={styles.venueBadgeInfo}>
        <Text
          style={[styles.venueBadgeName, { color: c.text.primary }]}
          numberOfLines={1}
        >
          {venueName}
        </Text>
        <View style={styles.venueBadgeLiveRow}>
          <Animated.View
            style={[
              styles.venueBadgeDot,
              { opacity: glowOpacity, transform: [{ scale: dotScale }] },
            ]}
          >
            <View style={styles.venueBadgeDotInner} />
          </Animated.View>
          <Text
            style={[
              styles.venueBadgeLiveText,
              { color: isDark ? c.accent.success : '#00795A' },
            ]}
          >
            {isRu ? 'Вы здесь' : "You're here"}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={isDark ? c.accent.success : '#00795A'}
      />
    </TouchableOpacity>
  );
}

// ─── Cluster renderer ────────────────────────────────────

function renderCluster(cluster: any) {
  const { id, geometry, onPress, properties } = cluster;
  const count = properties.point_count;
  return (
    <Marker
      key={`cluster-${id}`}
      coordinate={{
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges
      onPress={onPress}
    >
      <View style={styles.cluster} collapsable={false}>
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    </Marker>
  );
}

// ─── Main screen ─────────────────────────────────────────

export default function MapScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const {
    data: venues,
    isLoading: venuesLoading,
  } = useAllVenues();
  const { data: activeCheckin } = useActiveCheckin();
  const { checkinMutation } = useCheckin();
  const recentCheckins = useRealtimeCheckins();
  const { visible: showOnboarding, dismiss: dismissOnboarding } =
    useMapOnboardingVisible();

  const [selectedVenue, setSelectedVenue] = useState<VenueWithStats | null>(
    null,
  );
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegionBounds>(() => ({
    latitude: MAP_BOOT_REGION.latitude,
    longitude: MAP_BOOT_REGION.longitude,
    latitudeDelta: MAP_BOOT_REGION.latitudeDelta,
    longitudeDelta: MAP_BOOT_REGION.longitudeDelta,
  }));
  const mapRef = useRef<any>(null);
  const centeredOnUserRef = useRef(false);

  /** Tab bar sits below map screen; FAB sits above venue card strip only. */
  const locationFabBottom = COMPACT_VENUE_STRIP_HEIGHT + spacing.md;

  const filteredVenues = useMemo(() => {
    if (!venues) return [];
    if (!typeFilter) return venues;
    return venues.filter((v) => v.type === typeFilter);
  }, [venues, typeFilter]);

  const venuesInViewport = useMemo(() => {
    return filteredVenues.filter((v) =>
      isLatLngInMapRegion(
        Number(v.latitude),
        Number(v.longitude),
        mapRegion,
      ),
    );
  }, [filteredVenues, mapRegion]);

  const centerOnUser = useCallback(() => {
    if (!location || !mapRef.current || centeredOnUserRef.current) return;
    centeredOnUserRef.current = true;
    mapRef.current.animateToRegion?.(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      Platform.OS === 'android' ? 500 : 400,
    );
  }, [location]);

  useEffect(() => {
    if (!location) return;
    const t = setTimeout(centerOnUser, Platform.OS === 'android' ? 200 : 120);
    return () => clearTimeout(t);
  }, [location, centerOnUser]);

  const lastMarkerPressRef = useRef<{ id: string; at: number } | null>(null);
  const handleMarkerPress = useCallback((venue: VenueWithStats) => {
    const now = Date.now();
    const last = lastMarkerPressRef.current;
    if (last && last.id === venue.id && now - last.at < 450) return;
    lastMarkerPressRef.current = { id: venue.id, at: now };
    setSelectedVenue(venue);
  }, []);

  const handleCardSelect = useCallback(
    (venue: VenueWithStats) => {
      setSelectedVenue(venue);
      mapRef.current?.animateToRegion?.(
        {
          latitude: Number(venue.latitude),
          longitude: Number(venue.longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    },
    [],
  );

  const handleCheckin = useCallback(() => {
    if (!selectedVenue || !location) return;
    checkinMutation.mutate(
      {
        venue_id: selectedVenue.id,
        lat: location.latitude,
        lng: location.longitude,
      },
      {
        onSuccess: (result) => {
          setSelectedVenue(null);
          Alert.alert(
            'Checked in!',
            `You earned ${result.tokens_earned} tokens`,
          );
        },
        onError: (err: any) => {
          Alert.alert('Check-in failed', err.message || 'Unknown error');
        },
      },
    );
  }, [selectedVenue, location, checkinMutation]);

  const tagline = activeCheckin
    ? t('map.taglineCheckedIn')
    : t('map.tagline');

  return (
    <View style={[styles.container, { backgroundColor: c.bg.primary }]}>
      {/* ─── Top bar ─────────────────────────────────── */}
      <LinearGradient
        colors={
          isDark
            ? [`${c.bg.primary}FF`, `${c.bg.primary}E6`, `${c.bg.primary}99`, `${c.bg.primary}00`]
            : ['rgba(245,245,250,1)', 'rgba(245,245,250,0.92)', 'rgba(245,245,250,0.6)', 'rgba(245,245,250,0)']
        }
        locations={[0, 0.55, 0.8, 1]}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarRow}>
          <View style={styles.logoCol}>
            <View style={styles.logoRow}>
              <LogoMark size={28} />
              <Text style={[styles.logo, { color: c.text.primary }]}>
                EyesTalk
              </Text>
            </View>
            <Text
              style={[styles.tagline, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              {tagline}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.qrButtonWrap}
            onPress={() =>
              router.push('/(app)/venue/check-in' as any)
            }
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#7C6FF7', '#A29BFE']
                  : ['#6C5CE7', '#7C6FF7']
              }
              style={styles.qrButton}
            >
              <Ionicons name="qr-code" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {activeCheckin && (
          <PulsingVenueBadge
            checkin={activeCheckin}
            isDark={isDark}
            c={c}
          />
        )}

        {/* ─── Venue type filters ───────────────────── */}
        <VenueTypeFilters
          venues={venues}
          selectedType={typeFilter}
          onSelectType={setTypeFilter}
        />
      </LinearGradient>

      {/* ─── Map (mounts immediately; location centers user when ready) ─ */}
      <ClusteredMapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined
        }
        customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        initialRegion={{
          latitude: MAP_BOOT_REGION.latitude,
          longitude: MAP_BOOT_REGION.longitude,
          latitudeDelta: MAP_BOOT_REGION.latitudeDelta,
          longitudeDelta: MAP_BOOT_REGION.longitudeDelta,
        }}
        showsUserLocation={!!location}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={() => setSelectedVenue(null)}
        onRegionChangeComplete={(region) => {
          setMapRegion({
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          });
        }}
        onMapReady={() => {
          const delay = Platform.OS === 'android' ? 100 : 250;
          setTimeout(() => setMarkersReady(true), delay);
          setTimeout(centerOnUser, delay + (Platform.OS === 'android' ? 80 : 60));
        }}
        clusterColor="#7C6FF7"
        clusterTextColor="#FFFFFF"
        radius={50}
        minPoints={2}
        renderCluster={renderCluster}
      >
        {markersReady &&
          filteredVenues.map((venue) => (
            <LiveVenueMarker
              key={venue.id}
              venue={venue}
              isSelected={selectedVenue?.id === venue.id}
              recentlyActive={recentCheckins.has(venue.id)}
              onPress={handleMarkerPress}
            />
          ))}
      </ClusteredMapView>

      {/* ─── Empty state ─────────────────────────────── */}
      {venues && venues.length === 0 && !venuesLoading && (
        <View style={styles.emptyOverlay}>
          <Text style={[styles.emptyTitle, { color: c.text.primary }]}>
            {t('map.noVenues')}
          </Text>
          <Text style={[styles.emptyHint, { color: c.text.secondary }]}>
            {t('map.noVenuesHint')}
          </Text>
        </View>
      )}

      {/* ─── My location button ──────────────────────── */}
      <TouchableOpacity
        style={[
          styles.myLocationBtn,
          shadows.lg,
          {
            bottom: locationFabBottom,
            backgroundColor: c.bg.secondary,
            borderColor: isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }}
      >
        <Ionicons
          name="locate-outline"
          size={22}
          color={c.accent.primary}
        />
      </TouchableOpacity>

      {/* ─── Nearby venue cards ──────────────────────── */}
      {!selectedVenue && venuesInViewport.length > 0 && (
        <NearbyVenueCards
          venues={venuesInViewport}
          userLocation={location}
          activeCheckin={activeCheckin}
          bottomOffset={0}
          onSelectVenue={handleCardSelect}
        />
      )}

      {/* ─── Venue bottom sheet ──────────────────────── */}
      {selectedVenue && (
        <VenueBottomSheet
          venue={selectedVenue}
          userLocation={location}
          activeCheckin={activeCheckin}
          checkinPending={checkinMutation.isPending}
          insets={{ bottom: insets.bottom }}
          onCheckin={handleCheckin}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {/* ─── Onboarding overlay ──────────────────────── */}
      {showOnboarding && (
        <MapOnboarding onDismiss={dismissOnboarding} />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoCol: { gap: 2 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: { width: 34, height: 34 },
  logo: {
    fontSize: typography.size.headingLg,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.heading,
  },
  tagline: {
    fontSize: typography.size.bodySm,
    marginLeft: 42,
    opacity: 0.8,
  },
  qrButtonWrap: {
    ...shadows.glowPrimary,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  venueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    ...shadows.glowSuccess,
  },
  venueBadgeLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  venueBadgeLogoImg: { width: 40, height: 40, borderRadius: 12 },
  venueBadgeEmoji: { fontSize: 20 },
  venueBadgeInfo: { flex: 1 },
  venueBadgeName: {
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  venueBadgeLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  venueBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueBadgeDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.success,
  },
  venueBadgeLiveText: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
  },

  cluster: {
    width: 40,
    height: 40,
    borderRadius: Platform.OS === 'android' ? 10 : 20,
    backgroundColor: '#7C6FF7',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.bold,
  },

  emptyOverlay: {
    position: 'absolute',
    top: '40%',
    left: spacing['3xl'],
    right: spacing['3xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.size.headingMd,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.size.bodyMd,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.bodyMd * 1.5,
  },

  myLocationBtn: {
    position: 'absolute',
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
