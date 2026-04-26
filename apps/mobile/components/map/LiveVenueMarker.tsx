import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { VENUE_EMOJI } from '@/lib/venue-constants';

const IS_ANDROID = Platform.OS === 'android';

/**
 * Android map markers: known issues with react-native-maps + Google Maps SDK
 * + Expo New Architecture (SDK 54+, RN 0.81+):
 *
 *   1. View → bitmap snapshot computes outer bounds incorrectly when the
 *      inner view has borderWidth + borderRadius, clipping the bottom of
 *      the marker (https://github.com/react-native-maps/react-native-maps/issues/5877).
 *      Fix: wrap the marker in an outer transparent <View> with a fixed
 *      width/height larger than the marker — gives SDK a stable bitmap size.
 *
 *   2. tracksViewChanges={true} permanently re-snapshots every frame
 *      (laggy + battery). tracksViewChanges={false} from the start
 *      snapshots before remote venue.logo_url has loaded → empty marker.
 *      Fix: keep tracksViewChanges=true *only* until the image has loaded
 *      (or for a short tick if no image), then flip to false.
 *
 *   3. Frequent setState (selection/active changes) — flip tracksViewChanges
 *      back to true briefly so the new visual state is captured.
 */

const MARKER_SIZE = 44;
// Outer wrapper must be larger than marker + max border (≈ 3px) on every side
// AND give Google Maps SDK enough headroom for shadow/bitmap padding.
const WRAPPER_SIZE = MARKER_SIZE + 24;
const EMOJI_FONT = IS_ANDROID ? 20 : 19;

interface Props {
  venue: VenueWithStats;
  isSelected: boolean;
  recentlyActive: boolean;
  onPress: (v: VenueWithStats) => void;
}

export const LiveVenueMarker = React.memo(function LiveVenueMarker({
  venue,
  isSelected,
  recentlyActive,
  onPress,
}: Props) {
  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;
  const emoji = VENUE_EMOJI[venue.type] || '📍';

  const borderColor = isSelected
    ? '#FFFFFF'
    : recentlyActive
      ? '#00E5A0'
      : hasActivity
        ? 'rgba(0,229,160,0.7)'
        : 'rgba(255,255,255,0.4)';

  const borderWidth = isSelected ? 2.5 : hasActivity ? 2 : 1.5;

  const markerStyle = useMemo(
    () => ({
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      borderRadius: IS_ANDROID ? 8 : MARKER_SIZE / 2,
      backgroundColor: '#7C6FF7' as const,
      borderWidth,
      borderColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [borderWidth, borderColor],
  );

  // ── Android: state-controlled tracksViewChanges ──
  const [trackChanges, setTrackChanges] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!IS_ANDROID) return;
    if (hasLogo && !imageLoaded) return;
    const t = setTimeout(() => setTrackChanges(false), 250);
    return () => clearTimeout(t);
  }, [imageLoaded, hasLogo]);

  useEffect(() => {
    if (!IS_ANDROID) return;
    setTrackChanges(true);
    const t = setTimeout(() => setTrackChanges(false), 250);
    return () => clearTimeout(t);
  }, [isSelected, recentlyActive, hasActivity]);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

  if (IS_ANDROID) {
    return (
      <Marker
        coordinate={{
          latitude: Number(venue.latitude),
          longitude: Number(venue.longitude),
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => onPress(venue)}
        tracksViewChanges={trackChanges}
      >
        {/* Outer transparent wrapper with FIXED dimensions — without it
            Android Google Maps clips the bottom of the marker bitmap. */}
        <View collapsable={false} style={s.androidWrapper}>
          <View collapsable={false} style={markerStyle}>
            {hasLogo ? (
              <Image
                source={{ uri: venue.logo_url! }}
                style={s.androidLogo}
                resizeMode="cover"
                onLoad={handleImageLoad}
                onError={handleImageLoad}
              />
            ) : (
              <Text style={s.androidEmoji}>{emoji}</Text>
            )}
          </View>
        </View>
      </Marker>
    );
  }

  // ── iOS: circular markers with activity ring & badge ──

  const pad = 12;
  const outer = MARKER_SIZE + pad * 2;

  return (
    <Marker
      coordinate={{
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(venue)}
      tracksViewChanges
    >
      <View
        style={{
          width: outer,
          height: outer,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        {hasActivity && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: MARKER_SIZE + 8,
              height: MARKER_SIZE + 8,
              borderRadius: (MARKER_SIZE + 8) / 2,
              backgroundColor: recentlyActive
                ? 'rgba(0,229,160,0.25)'
                : 'rgba(0,229,160,0.12)',
              borderWidth: 1,
              borderColor: recentlyActive
                ? 'rgba(0,229,160,0.5)'
                : 'rgba(0,229,160,0.25)',
            }}
          />
        )}

        {hasLogo ? (
          <View
            style={{
              width: MARKER_SIZE,
              height: MARKER_SIZE,
              borderRadius: MARKER_SIZE / 2,
              borderWidth,
              borderColor,
              backgroundColor: '#7C6FF7',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={{ uri: venue.logo_url! }}
              style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={markerStyle}>
            <Text style={{ fontSize: EMOJI_FONT }}>{emoji}</Text>
          </View>
        )}

        {hasActivity && (
          <View
            style={{
              position: 'absolute',
              top: pad - 4,
              right: pad - 4,
              backgroundColor: '#00E5A0',
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              borderWidth: 1.5,
              borderColor: '#0D0D1A',
            }}
          >
            <Text style={{ color: '#0D0D1A', fontSize: 10, fontWeight: '700' }}>
              {venue.active_checkins}
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
});

const s = StyleSheet.create({
  androidWrapper: {
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  androidLogo: {
    width: MARKER_SIZE - 6,
    height: MARKER_SIZE - 6,
    borderRadius: 6,
  },
  androidEmoji: {
    fontSize: EMOJI_FONT,
    textAlign: 'center',
  },
});
