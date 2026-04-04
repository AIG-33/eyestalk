import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { VENUE_EMOJI } from '@/lib/venue-constants';

const IS_ANDROID = Platform.OS === 'android';

const MARKER_SIZE = IS_ANDROID ? 46 : 44;
const EMOJI_FONT = IS_ANDROID ? 22 : Math.max(14, Math.floor(44 * 0.45));

/**
 * Android: borderRadius > ~12 on custom marker children causes the infamous
 * "quarter circle" bitmap snapshot bug in Google Maps SDK. We use rounded
 * squares (borderRadius: 10) on Android and keep circles on iOS.
 *
 * Also on Android we avoid: overflow:'hidden', borderRadius on Image,
 * and absolutely positioned children — all of these break the bitmap.
 */
const BORDER_RADIUS = IS_ANDROID ? 10 : MARKER_SIZE / 2;
const LOGO_INNER_RADIUS = IS_ANDROID ? 8 : 0;

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
    if (!IS_ANDROID || snapshotDone) return;
    if (!laidOut) return;
    if (hasLogo && !imgLoaded) return;

    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setSnapshotDone(true);
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [laidOut, imgLoaded, hasLogo, snapshotDone]);

  const emoji = VENUE_EMOJI[venue.type] || '📍';

  const borderColor = isSelected
    ? '#FFFFFF'
    : recentlyActive
      ? '#00E5A0'
      : hasActivity
        ? 'rgba(0,229,160,0.7)'
        : 'rgba(255,255,255,0.4)';

  const borderWidth = isSelected ? 2.5 : hasActivity ? 2 : 1.5;

  const tracksViewChanges =
    !IS_ANDROID || !snapshotDone || (hasLogo && !imgLoaded);

  const onRootLayout = useCallback(() => {
    setLaidOut(true);
  }, []);

  const shellStyle = useMemo(
    () => ({
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      borderRadius: BORDER_RADIUS,
      backgroundColor: '#7C6FF7' as const,
      borderWidth,
      borderColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [borderWidth, borderColor],
  );

  if (IS_ANDROID) {
    return (
      <Marker
        coordinate={{
          latitude: Number(venue.latitude),
          longitude: Number(venue.longitude),
        }}
        anchor={{ x: 0.5, y: 1 }}
        onPress={() => onPress(venue)}
        tracksViewChanges={tracksViewChanges}
      >
        <View
          collapsable={false}
          onLayout={onRootLayout}
          style={android.root}
        >
          {/* Main rounded-square marker */}
          <View collapsable={false} style={shellStyle}>
            {hasLogo ? (
              <Image
                source={{ uri: venue.logo_url! }}
                style={android.logoImg}
                resizeMode="cover"
                onLoad={() => setImgLoaded(true)}
              />
            ) : (
              <Text style={android.emoji}>{emoji}</Text>
            )}
          </View>

          {/* Pointer triangle below marker */}
          <View style={[android.pointer, { borderTopColor: borderColor }]} />

          {/* Activity count — rendered inline below, not absolute */}
          {hasActivity && (
            <View style={android.badge}>
              <Text style={android.badgeText}>
                {venue.active_checkins}
              </Text>
            </View>
          )}
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
      tracksViewChanges={tracksViewChanges}
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
          <View style={shellStyle}>
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

const android = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logoImg: {
    width: MARKER_SIZE - 4,
    height: MARKER_SIZE - 4,
    borderRadius: LOGO_INNER_RADIUS,
  },
  emoji: {
    fontSize: EMOJI_FONT,
    textAlign: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.4)',
    marginTop: -1,
  },
  badge: {
    marginTop: 2,
    backgroundColor: '#00E5A0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    color: '#0D0D1A',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
