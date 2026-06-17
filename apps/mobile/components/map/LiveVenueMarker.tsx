import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { LogoMark } from '@/components/ui/logo-mark';

/**
 * Unified venue marker — ONE rendering path for iOS and Android.
 *
 * Every venue renders as a fixed-size custom <View> marker, so the on-screen
 * size is identical for all venues regardless of the source logo's real pixel
 * dimensions (the <Image> scales any logo into the marker box). The size is
 * driven by the user's "map marker size" preference.
 *
 * Android note: the Google Maps SDK + New Architecture mis-measures custom
 * <View> markers that use native borderWidth on a rounded view, clipping them.
 * We use the same proven pattern as the cluster marker:
 *   • a transparent padding wrapper (collapsable={false}) gives the SDK a
 *     stable bitmap size so nothing is cut off,
 *   • the logo container has NO borderWidth (overflow:hidden only),
 *   • the ring is a separate inset overlay view,
 *   • tracksViewChanges starts true and flips off once the bitmap is stable.
 */

const PURPLE = '#7C6FF7';
const PUPIL = '#636DF3';

interface Props {
  venue: VenueWithStats;
  isSelected: boolean;
  recentlyActive: boolean;
  /** Logo-container diameter in dp (from the user's marker-size preference). */
  size: number;
  /** When true (Matches mode), emphasize venues with matching people. */
  matchMode?: boolean;
  onPress: (v: VenueWithStats) => void;
}

export const LiveVenueMarker = React.memo(function LiveVenueMarker({
  venue,
  isSelected,
  recentlyActive,
  size,
  matchMode = false,
  onPress,
}: Props) {
  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;
  const hasMatch = matchMode && venue.interest_matches > 0;

  const radius = Math.round(size * 0.28);
  const pad = Math.round(size * 0.34); // room for ring + halo + count badge
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

  // Keep view→bitmap snapshotting on until the marker is visually stable,
  // then turn it off for performance. Re-arm whenever the look changes.
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    setTracking(true);
    const t = setTimeout(() => setTracking(false), hasLogo ? 1500 : 350);
    return () => clearTimeout(t);
  }, [hasLogo, venue.logo_url, isSelected, recentlyActive, hasActivity, hasMatch, size]);

  return (
    <Marker
      coordinate={{
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(venue)}
      tracksViewChanges={tracking}
    >
      <View style={[styles.wrapper, { width: outer, height: outer }]} collapsable={false}>
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

        {/* Logo container — no borderWidth (avoids Android clipping) */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            overflow: 'hidden',
            backgroundColor: PURPLE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          collapsable={false}
        >
          {hasLogo ? (
            <Image
              source={{ uri: venue.logo_url! }}
              style={{ width: size, height: size }}
              resizeMode="cover"
              onLoadEnd={() => setTracking(false)}
            />
          ) : (
            <LogoMark size={Math.round(size * 0.62)} color={PURPLE} pupilColor={PUPIL} />
          )}
        </View>

        {/* Ring as an inset overlay (separate view, like the cluster marker) */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: pad,
            left: pad,
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: ringWidth,
            borderColor: ringColor,
          }}
        />

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
