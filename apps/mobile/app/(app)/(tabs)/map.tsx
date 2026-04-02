import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, Modal, Pressable, PixelRatio, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/use-location';
import { useAllVenues, type VenueWithStats } from '@/hooks/use-venues';
import { useActiveCheckin, useCheckin } from '@/hooks/use-checkin';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, shadows, radius, useTheme } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Android react-native-maps 1.20.1 captures marker bitmap at a fixed 100px.
// Marker dp size must satisfy: size * PixelRatio <= 100, otherwise it clips.
const MAX_BITMAP_PX = 96;
const MARKER_SIZE =
  Platform.OS === 'android'
    ? Math.min(44, Math.floor(MAX_BITMAP_PX / PixelRatio.get()))
    : 44;
const EMOJI_FONT = Math.max(14, Math.floor(MARKER_SIZE * 0.45));

const VenueMarker = React.memo(function VenueMarker({
  venue,
  isSelected,
  onPress,
}: {
  venue: VenueWithStats;
  isSelected: boolean;
  onPress: (v: VenueWithStats) => void;
}) {
  const [captured, setCaptured] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasLogo = !!venue.logo_url;

  useEffect(() => {
    const delay = hasLogo ? 2000 : 1200;
    const t = setTimeout(() => setCaptured(true), delay);
    return () => clearTimeout(t);
  }, [hasLogo]);

  const emoji = VENUE_EMOJI[venue.type] || '📍';

  return (
    <Marker
      coordinate={{
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
      }}
      onPress={() => onPress(venue)}
      tracksViewChanges={!captured || (hasLogo && !imgLoaded)}
    >
      <View
        collapsable={false}
        style={{
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          borderRadius: MARKER_SIZE / 2,
          backgroundColor: '#7C6FF7',
          borderWidth: isSelected ? 2.5 : 1.5,
          borderColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hasLogo ? (
          <Image
            source={{ uri: venue.logo_url! }}
            style={{ width: MARKER_SIZE - 2, height: MARKER_SIZE - 2, borderRadius: MARKER_SIZE / 2 }}
            resizeMode="cover"
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <Text style={{ fontSize: EMOJI_FONT }}>{emoji}</Text>
        )}
      </View>
    </Marker>
  );
});

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

const LIGHT_MAP_STYLE: any[] = [];

export default function MapScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const { data: venues, error: venuesError, isLoading: venuesLoading } = useAllVenues();
  const { data: activeCheckin } = useActiveCheckin();
  const { checkinMutation } = useCheckin();
  const [selectedVenue, setSelectedVenue] = useState<VenueWithStats | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleMarkerPress = useCallback((venue: VenueWithStats) => {
    setSelectedVenue(venue);
  }, []);

  const handleCheckin = useCallback(() => {
    if (!selectedVenue || !location) return;
    checkinMutation.mutate(
      { venue_id: selectedVenue.id, lat: location.latitude, lng: location.longitude },
      {
        onSuccess: (result) => {
          setSelectedVenue(null);
          Alert.alert('Checked in!', `You earned ${result.tokens_earned} tokens`);
        },
        onError: (err: any) => {
          Alert.alert('Check-in failed', err.message || 'Unknown error');
        },
      },
    );
  }, [selectedVenue, location, checkinMutation]);

  const isCheckedInHere = activeCheckin?.venue_id === selectedVenue?.id;

  return (
    <View style={[styles.container, { backgroundColor: c.bg.primary }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.logoRow}>
          <Image
            source={require('@/assets/logo-purple.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={[styles.logo, { color: c.text.primary }]}>EyesTalk</Text>
        </View>
        <View style={styles.topActions}>
          {activeCheckin && (
            <TouchableOpacity
              style={[styles.activeBadge, {
                backgroundColor: isDark ? 'rgba(0,229,160,0.1)' : 'rgba(0,180,130,0.12)',
                borderColor: isDark ? 'rgba(0,229,160,0.2)' : 'rgba(0,160,120,0.25)',
              }]}
              onPress={() => router.push(`/(app)/venue/${activeCheckin.venue_id}` as any)}
            >
              <View style={[styles.liveDot, shadows.glowSuccess]} />
              <Text style={[styles.activeBadgeText, { color: isDark ? c.accent.success : '#00795A' }]} numberOfLines={1}>
                {(activeCheckin as any).venues?.name}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: c.bg.secondary, borderColor: isDark ? 'rgba(124,111,247,0.2)' : 'rgba(108,92,231,0.15)' }]}
            onPress={() => router.push('/(app)/venue/check-in' as any)}
          >
            <Ionicons name="qr-code-outline" size={26} color={c.accent.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      {location && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          onPress={() => setSelectedVenue(null)}
          onMapReady={() => {
            setTimeout(() => setMarkersReady(true), 300);
          }}
        >
          {markersReady && venues?.map((venue) => (
              <VenueMarker
                key={venue.id}
                venue={venue}
                isSelected={selectedVenue?.id === venue.id}
                onPress={handleMarkerPress}
              />
          ))}
        </MapView>
      )}

      {/* No venues hint */}
      {venues && venues.length === 0 && !venuesLoading && (
        <View style={styles.emptyOverlay}>
          <Text style={[styles.emptyTitle, { color: c.text.primary }]}>{t('map.noVenues')}</Text>
          <Text style={[styles.emptyHint, { color: c.text.secondary }]}>{t('map.noVenuesHint')}</Text>
        </View>
      )}

      {/* My location button */}
      <TouchableOpacity
        style={[styles.myLocationBtn, shadows.lg, { backgroundColor: c.bg.secondary, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
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
        <Ionicons name="locate-outline" size={22} color={c.accent.primary} />
      </TouchableOpacity>

      {/* Venue popup bottom sheet */}
      {selectedVenue && (
        <Modal
          transparent
          animationType="slide"
          visible={!!selectedVenue}
          onRequestClose={() => setSelectedVenue(null)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setSelectedVenue(null)} />
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: c.bg.secondary, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

            {/* Venue header */}
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetEmojiWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                {selectedVenue.logo_url ? (
                  <Image source={{ uri: selectedVenue.logo_url }} style={styles.sheetLogo} resizeMode="cover" />
                ) : (
                  <Text style={styles.sheetEmoji}>{VENUE_EMOJI[selectedVenue.type] || '📍'}</Text>
                )}
              </View>
              <View style={styles.sheetHeaderInfo}>
                <Text style={[styles.sheetName, { color: c.text.primary }]} numberOfLines={1}>{selectedVenue.name}</Text>
                <View style={styles.sheetMeta}>
                  <Text style={[styles.sheetType, { color: c.text.secondary }]}>{selectedVenue.type.replace('_', ' ')}</Text>
                  {selectedVenue.active_checkins > 0 && (
                    <View style={styles.sheetLive}>
                      <View style={styles.sheetLiveDot} />
                      <Text style={styles.sheetLiveText}>
                        {selectedVenue.active_checkins} {t('map.activeNow', { defaultValue: 'active' })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Address */}
            {selectedVenue.address && (
              <View style={styles.sheetRow}>
                <Ionicons name="location-outline" size={16} color={c.text.tertiary} />
                <Text style={[styles.sheetAddress, { color: c.text.tertiary }]} numberOfLines={2}>{selectedVenue.address}</Text>
              </View>
            )}

            {/* Navigation buttons */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(124,111,247,0.1)' : 'rgba(108,92,231,0.08)', borderColor: isDark ? 'rgba(124,111,247,0.2)' : 'rgba(108,92,231,0.15)' }]}
                onPress={() => {
                  const lat = Number(selectedVenue.latitude);
                  const lng = Number(selectedVenue.longitude);
                  const url = Platform.select({
                    ios: `maps:?daddr=${lat},${lng}&dirflg=w`,
                    android: `google.navigation:q=${lat},${lng}&mode=w`,
                  });
                  if (url) Linking.openURL(url);
                }}
              >
                <Ionicons name="navigate-outline" size={18} color={c.accent.primary} />
                <Text style={[styles.navBtnText, { color: c.accent.primary }]}>
                  {t('common.cancel') === 'Отмена' ? 'Маршрут' : 'Directions'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                onPress={() => {
                  const lat = Number(selectedVenue.latitude);
                  const lng = Number(selectedVenue.longitude);
                  const label = encodeURIComponent(selectedVenue.name);
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`);
                }}
              >
                <Ionicons name="map-outline" size={18} color={c.text.secondary} />
                <Text style={[styles.navBtnText, { color: c.text.secondary }]}>Google Maps</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            {selectedVenue.description && (
              <Text style={[styles.sheetDesc, { color: c.text.secondary }]} numberOfLines={3}>{selectedVenue.description}</Text>
            )}

            {/* Actions */}
            <View style={styles.sheetActions}>
              {isCheckedInHere ? (
                <TouchableOpacity
                  style={styles.sheetBtnCheckedIn}
                  onPress={() => {
                    setSelectedVenue(null);
                    router.push(`/(app)/venue/${selectedVenue.id}` as any);
                  }}
                >
                  <View style={styles.sheetCheckedDot} />
                  <Text style={styles.sheetBtnCheckedInText}>{t('venue.checkedIn', { defaultValue: 'Checked In' })}</Text>
                </TouchableOpacity>
              ) : activeCheckin ? (
                <View style={[styles.sheetBtnDisabled, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                  <Text style={[styles.sheetBtnDisabledText, { color: c.text.tertiary }]}>{t('venue.checkedInElsewhereHint', { defaultValue: 'Checked in elsewhere' })}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.sheetBtnCheckin, { backgroundColor: c.accent.primary }]}
                  onPress={handleCheckin}
                  disabled={checkinMutation.isPending}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.sheetBtnCheckinText}>
                    {checkinMutation.isPending ? t('common.loading') : t('venue.checkin', { defaultValue: 'Check In' })}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.sheetBtnDetails}
                onPress={() => {
                  setSelectedVenue(null);
                  router.push(`/(app)/venue/${selectedVenue.id}` as any);
                }}
              >
                <Text style={[styles.sheetBtnDetailsText, { color: c.accent.primaryLight }]}>{t('map.viewDetails', { defaultValue: 'View Details' })}</Text>
                <Ionicons name="chevron-forward" size={16} color={c.accent.primaryLight} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: { width: 34, height: 34 },
  logo: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, letterSpacing: typography.letterSpacing.heading,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1,
    maxWidth: 180,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.accent.success },
  activeBadgeText: {
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
  scanButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,111,247,0.2)',
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

  myLocationBtn: {
    position: 'absolute', right: spacing.xl, bottom: 100,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Bottom sheet popup
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.md,
  },
  sheetEmojiWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sheetEmoji: { fontSize: 28 },
  sheetLogo: { width: 48, height: 48, borderRadius: 14 },
  sheetHeaderInfo: { flex: 1 },
  sheetName: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  sheetType: {
    fontSize: typography.size.bodySm, color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  sheetLive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,160,0.1)', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: radius.full,
  },
  sheetLiveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent.success },
  sheetLiveText: {
    color: colors.accent.success, fontSize: typography.size.micro || 10,
    fontWeight: typography.weight.bold,
  },

  navRow: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md,
  },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: 10, borderRadius: radius.lg,
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: typography.size.bodySm, fontWeight: typography.weight.semibold,
  },
  sheetRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetAddress: {
    flex: 1, color: colors.text.tertiary, fontSize: typography.size.bodySm,
    lineHeight: typography.size.bodySm * 1.4,
  },
  sheetDesc: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.5, marginBottom: spacing.md,
  },

  sheetActions: { gap: spacing.sm, marginTop: spacing.sm },
  sheetBtnCheckin: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent.primary, borderRadius: radius.lg,
    paddingVertical: 14,
  },
  sheetBtnCheckinText: {
    color: '#FFFFFF', fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  sheetBtnCheckedIn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(0,229,160,0.1)', borderRadius: radius.lg,
    paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)',
  },
  sheetCheckedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.success },
  sheetBtnCheckedInText: {
    color: colors.accent.success, fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  sheetBtnDisabled: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radius.lg,
    paddingVertical: 14,
  },
  sheetBtnDisabledText: {
    color: colors.text.tertiary, fontSize: typography.size.bodyMd,
  },
  sheetBtnDetails: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: 12,
  },
  sheetBtnDetailsText: {
    color: colors.accent.primaryLight, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
});
