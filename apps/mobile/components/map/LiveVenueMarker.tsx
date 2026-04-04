import React, { useMemo } from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { VENUE_EMOJI } from '@/lib/venue-constants';

const IS_ANDROID = Platform.OS === 'android';

/**
 * react-native-maps custom View markers are broken on Android with
 * New Architecture (Expo SDK 54 / RN 0.81+). The bitmap snapshot taken
 * when tracksViewChanges flips to false is corrupted. Workaround:
 * keep tracksViewChanges={true} on Android and use a minimal view tree.
 */

const MARKER_SIZE = 44;
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

  if (IS_ANDROID) {
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
        <View collapsable={false} style={markerStyle}>
          {hasLogo ? (
            <Image
              source={{ uri: venue.logo_url! }}
              style={s.androidLogo}
              resizeMode="cover"
            />
          ) : (
            <Text style={s.androidEmoji}>{emoji}</Text>
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
