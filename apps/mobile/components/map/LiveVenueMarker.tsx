import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import type { MarkerSize } from '@/stores/ui.store';
import { LogoMark } from '@/components/ui/logo-mark';

/**
 * Venue marker — ONE size, controlled by the user's "map marker size" setting.
 *
 * Platform strategy (deliberate split):
 *  • Android — the Google Maps SDK + New Architecture mis-renders custom <View>
 *    markers into a bitmap (clips them / shows only a corner). So Android uses
 *    NATIVE <Marker image>: a remote logo normalized to an exact pixel size via
 *    an image proxy, or a pre-rendered fallback PNG. This draws natively and is
 *    rock-solid + uniformly sized for every venue.
 *  • iOS — custom <View> markers render perfectly, so we keep the richer look
 *    (logo + activity ring + count badge), sized in dp.
 */

const IS_ANDROID = Platform.OS === 'android';
const PURPLE = '#7C6FF7';
const PUPIL = '#636DF3';

// iOS: logo-container diameter in dp.
const SIZE_DP: Record<MarkerSize, number> = { small: 34, medium: 44, large: 56 };
// Android: native marker bitmap size in PIXELS (must match generate-markers.mjs).
const MARKER_PX: Record<MarkerSize, number> = { small: 110, medium: 140, large: 180 };

// Pre-rendered Android fallback PNGs (no logo), per size + state.
const FALLBACK: Record<MarkerSize, { default: number; selected: number; active: number }> = {
  small: {
    default: require('../../assets/markers/venue-sm.png'),
    selected: require('../../assets/markers/venue-selected-sm.png'),
    active: require('../../assets/markers/venue-active-sm.png'),
  },
  medium: {
    default: require('../../assets/markers/venue-md.png'),
    selected: require('../../assets/markers/venue-selected-md.png'),
    active: require('../../assets/markers/venue-active-md.png'),
  },
  large: {
    default: require('../../assets/markers/venue-lg.png'),
    selected: require('../../assets/markers/venue-selected-lg.png'),
    active: require('../../assets/markers/venue-active-lg.png'),
  },
};

/** Normalize any logo URL to an exact square circular PNG via images.weserv.nl. */
function proxiedLogo(url: string, px: number): string {
  const src = url.replace(/^https?:\/\//, '');
  return (
    `https://images.weserv.nl/?url=ssl:${encodeURIComponent(src)}` +
    `&w=${px}&h=${px}&fit=cover&mask=circle&output=png`
  );
}

interface Props {
  venue: VenueWithStats;
  isSelected: boolean;
  recentlyActive: boolean;
  /** User's marker-size preference. */
  sizeKey: MarkerSize;
  matchMode?: boolean;
  onPress: (v: VenueWithStats) => void;
}

export const LiveVenueMarker = React.memo(function LiveVenueMarker({
  venue,
  isSelected,
  recentlyActive,
  sizeKey,
  matchMode = false,
  onPress,
}: Props) {
  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;
  const hasMatch = matchMode && venue.interest_matches > 0;

  // ─────────────────────────── Android: native image marker ───────────────
  if (IS_ANDROID) {
    const px = MARKER_PX[sizeKey];
    const coordinate = {
      latitude: Number(venue.latitude),
      longitude: Number(venue.longitude),
    };

    if (hasLogo) {
      return (
        <Marker
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => onPress(venue)}
          tracksViewChanges={false}
          image={{ uri: proxiedLogo(venue.logo_url!, px) }}
        />
      );
    }

    const variant = isSelected
      ? 'selected'
      : recentlyActive || hasActivity
        ? 'active'
        : 'default';
    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => onPress(venue)}
        tracksViewChanges={false}
        image={FALLBACK[sizeKey][variant]}
      />
    );
  }

  // ─────────────────────────── iOS: custom view marker ────────────────────
  const size = SIZE_DP[sizeKey];
  const radius = Math.round(size * 0.28);
  const pad = Math.round(size * 0.34);
  const outer = size + pad * 2;

  const ringColor = isSelected
    ? '#FFFFFF'
    : hasMatch
      ? '#FF6B9D'
      : recentlyActive
        ? '#00E5A0'
        : hasActivity
          ? 'rgba(0,229,160,0.8)'
          : 'rgba(255,255,255,0.5)';
  const ringWidth = isSelected || hasMatch ? Math.max(2, size * 0.06) : hasActivity ? size * 0.05 : size * 0.035;

  return (
    <Marker
      coordinate={{
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(venue)}
      tracksViewChanges={false}
    >
      <View style={[styles.wrapper, { width: outer, height: outer }]}>
        {hasActivity && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: size + pad,
              height: size + pad,
              borderRadius: (size + pad) / 2,
              backgroundColor: recentlyActive ? 'rgba(0,229,160,0.22)' : 'rgba(0,229,160,0.1)',
            }}
          />
        )}

        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            overflow: 'hidden',
            backgroundColor: PURPLE,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: ringWidth,
            borderColor: ringColor,
          }}
        >
          {hasLogo ? (
            <Image
              source={{ uri: venue.logo_url! }}
              style={{ width: size, height: size }}
              resizeMode="cover"
            />
          ) : (
            <LogoMark size={Math.round(size * 0.62)} color={PURPLE} pupilColor={PUPIL} />
          )}
        </View>

        {hasActivity && (
          <View style={[styles.countBadge, { top: pad - size * 0.18, right: pad - size * 0.18 }]}>
            <Text style={styles.countText}>
              {venue.active_checkins > 99 ? '99+' : venue.active_checkins}
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  countBadge: {
    position: 'absolute',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#00E5A0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0D0D1A',
  },
  countText: {
    color: '#0D0D1A',
    fontSize: 10,
    fontWeight: '700',
  },
});
