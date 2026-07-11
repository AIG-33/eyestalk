import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, radius, typography, shadows, useTheme } from '@/theme';

interface VenueLocationPickerProps {
  /** Selected point (the venue location). */
  latitude: number;
  longitude: number;
  /** The user's current GPS, used by the "recenter" button (optional). */
  userLocation?: { latitude: number; longitude: number } | null;
  /** Fires with the picked coordinate as the user pans the map. */
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

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

/**
 * A drag-the-map location picker: a fixed pin sits in the center of the map,
 * and panning the map moves the selected point. A "recenter" button snaps the
 * camera back to the user's live GPS. Single map + single pin — no marker
 * clustering and no heavy marker mounting, so it can't reintroduce the
 * launch/OOM issues the main map screen guards against.
 */
export function VenueLocationPicker({
  latitude,
  longitude,
  userLocation,
  onChange,
  height = 280,
}: VenueLocationPickerProps) {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const mapRef = useRef<MapView | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      setDragging(false);
      onChange(
        Math.round(region.latitude * 1e6) / 1e6,
        Math.round(region.longitude * 1e6) / 1e6,
      );
    },
    [onChange],
  );

  const recenterToUser = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      350,
    );
  }, [userLocation]);

  return (
    <View style={[styles.wrap, { height, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        onRegionChange={() => setDragging(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Fixed center pin — the venue is placed wherever the map is centered. */}
      <View pointerEvents="none" style={styles.pinContainer}>
        <View style={[styles.pinShadow, dragging && styles.pinShadowLifted]} />
        <Ionicons
          name="location"
          size={40}
          color={c.accent.primary}
          style={[styles.pinIcon, dragging && styles.pinIconLifted]}
        />
      </View>

      {/* Recenter to my current GPS */}
      {userLocation && (
        <TouchableOpacity
          style={[
            styles.recenterBtn,
            shadows.lg,
            {
              backgroundColor: c.bg.secondary,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
          onPress={recenterToUser}
          activeOpacity={0.85}
          accessibilityLabel={t('createVenue.recenter')}
        >
          <Ionicons name="locate" size={20} color={c.accent.primary} />
        </TouchableOpacity>
      )}

      {/* Hint pill */}
      <View
        pointerEvents="none"
        style={[
          styles.hint,
          { backgroundColor: isDark ? 'rgba(13,13,26,0.8)' : 'rgba(255,255,255,0.9)' },
        ]}
      >
        <Text style={[styles.hintText, { color: c.text.secondary }]} numberOfLines={1}>
          {t('createVenue.mapPickerHint')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  pinContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pin tip points at the exact center; nudge the icon up by half its height.
  pinIcon: {
    marginBottom: 40,
  },
  pinIconLifted: {
    marginBottom: 48,
  },
  pinShadow: {
    position: 'absolute',
    top: '50%',
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pinShadowLifted: {
    width: 14,
    opacity: 0.5,
  },
  recenterBtn: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  hint: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  hintText: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.medium,
  },
});
