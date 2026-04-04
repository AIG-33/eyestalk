import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { VENUE_EMOJI } from '@/lib/venue-constants';

// Even logical sizes; Android snapshots custom markers to a bitmap — keep layout flat.
const BASE_MARKER_SIZE = Platform.OS === 'android' ? 48 : 44;
const EMOJI_FONT = Math.max(14, Math.floor(BASE_MARKER_SIZE * 0.45));

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
  const [imgLoaded, setImgLoaded] = useState(false);
  /** Android: after layout + optional image load, wait two frames then stop tracksViewChanges */
  const [laidOut, setLaidOut] = useState(false);
  const [snapshotDone, setSnapshotDone] = useState(false);

  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;

  const resetSnapshotState = useCallback(() => {
    setImgLoaded(false);
    setLaidOut(false);
    setSnapshotDone(false);
  }, []);

  useEffect(() => {
    resetSnapshotState();
  }, [venue.id, venue.logo_url, resetSnapshotState]);

  useEffect(() => {
    if (Platform.OS === 'ios' || snapshotDone) return;
    if (!laidOut) return;
    if (hasLogo && !imgLoaded) return;

    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setSnapshotDone(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [laidOut, imgLoaded, hasLogo, snapshotDone]);

  const emoji = VENUE_EMOJI[venue.type] || '📍';
  const markerSize = BASE_MARKER_SIZE;
  const pad = 12;
  const outer = markerSize + pad * 2;

  const borderColor = isSelected
    ? '#FFFFFF'
    : recentlyActive
      ? '#00E5A0'
      : hasActivity
        ? 'rgba(0,229,160,0.7)'
        : 'rgba(255,255,255,0.4)';

  const borderWidth = isSelected ? 2.5 : hasActivity ? 2 : 1.5;

  const tracksViewChanges =
    Platform.OS === 'ios' ||
    !snapshotDone ||
    (hasLogo && !imgLoaded);

  const onRootLayout = useCallback(() => {
    setLaidOut(true);
  }, []);

  const logoImageStyle = useMemo(
    () => ({
      width: markerSize,
      height: markerSize,
      borderRadius: markerSize / 2,
      borderWidth,
      borderColor,
      backgroundColor: '#7C6FF7' as const,
    }),
    [markerSize, borderWidth, borderColor],
  );

  /**
   * iOS: overflow hidden clips image to circle. Android: overflow:hidden on custom Marker
   * children often snapshots as a wedge/¼ circle — omit it; View bg still respects borderRadius.
   */
  const circleShellStyle = useMemo(
    () => ({
      width: markerSize,
      height: markerSize,
      borderRadius: markerSize / 2,
      backgroundColor: '#7C6FF7' as const,
      borderWidth,
      borderColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...(Platform.OS === 'ios' ? { overflow: 'hidden' as const } : {}),
    }),
    [markerSize, borderWidth, borderColor],
  );

  return (
    <Marker
      coordinate={{
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(venue)}
      tracksViewChanges={tracksViewChanges}
    >
      <View
        collapsable={false}
        onLayout={onRootLayout}
        style={{
          width: outer,
          height: outer,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasActivity && Platform.OS === 'ios' && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: markerSize + 8,
              height: markerSize + 8,
              borderRadius: (markerSize + 8) / 2,
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
          Platform.OS === 'android' ? (
            <Image
              source={{ uri: venue.logo_url! }}
              style={logoImageStyle}
              resizeMode="cover"
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <View style={circleShellStyle}>
              <Image
                source={{ uri: venue.logo_url! }}
                style={{
                  width: markerSize,
                  height: markerSize,
                }}
                resizeMode="cover"
                onLoad={() => setImgLoaded(true)}
              />
            </View>
          )
        ) : (
          <View style={circleShellStyle}>
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
