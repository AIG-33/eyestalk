import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import type { MarkerSize } from '@/stores/ui.store';
import { VENUE_EMOJI } from '@/lib/venue-constants';
import { venueAmbient } from '@/theme';

/**
 * Venue marker — ONE size, controlled by the user's "map marker size" setting.
 *
 * Platform strategy (deliberate split):
 *  • Android + logo — the Google Maps SDK + New Architecture mis-renders some
 *    custom <View> markers, so venues WITH a logo use NATIVE <Marker image>:
 *    a remote logo normalized to an exact pixel size via an image proxy.
 *    Remote bitmaps draw at their intrinsic pixel size — uniform everywhere.
 *  • Android + no logo — bundled PNG fallbacks are NOT an option: local
 *    resources go through BitmapFactory.decodeResource which applies the
 *    device density (mdpi bucket → ×2–3.5 on real phones), making them
 *    gigantic next to remote-logo markers. Instead we render a small custom
 *    <View> emoji chip using the same Android-safe pattern as the cluster
 *    marker (transparent fixed-size wrapper, no borderWidth on the snapshot
 *    root, tracksViewChanges flips off after one frame). Sized in dp, so it
 *    matches iOS and stays frozen after the first snapshot (~10k venues).
 *  • iOS — custom <View> markers render perfectly, so we keep the richer look
 *    (logo/emoji + activity ring + count badge), sized in dp.
 */

const IS_ANDROID = Platform.OS === 'android';
const PURPLE = '#7C6FF7';

// Logo/emoji chip diameter in dp (custom view markers).
const SIZE_DP: Record<MarkerSize, number> = { small: 34, medium: 44, large: 56 };
// Android remote-logo marker bitmap size in PIXELS (intrinsic draw size).
const MARKER_PX: Record<MarkerSize, number> = { small: 110, medium: 140, large: 180 };

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

  // Android snapshots custom-view markers to a bitmap once. Keep
  // tracksViewChanges on briefly so the emoji glyph is captured, then freeze
  // so ~10k markers don't re-render every frame. Re-warm when the visual
  // state changes (selection / activity / size).
  const needsWarmup = IS_ANDROID && !hasLogo;
  const [tracking, setTracking] = useState(needsWarmup);
  useEffect(() => {
    if (!needsWarmup) return;
    setTracking(true);
    const t = setTimeout(() => setTracking(false), 300);
    return () => clearTimeout(t);
  }, [needsWarmup, isSelected, recentlyActive, hasActivity, sizeKey]);

  const coordinate = {
    latitude: Number(venue.latitude),
    longitude: Number(venue.longitude),
  };

  // ─────────────────────── Android + logo: native image marker ────────────
  if (IS_ANDROID && hasLogo) {
    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => onPress(venue)}
        tracksViewChanges={false}
        image={{ uri: proxiedLogo(venue.logo_url!, MARKER_PX[sizeKey]) }}
      />
    );
  }

  const size = SIZE_DP[sizeKey];
  const radius = Math.round(size * 0.28);
  const emoji = VENUE_EMOJI[venue.type] || '📍';
  const ambient = venueAmbient[venue.type]?.[0] ?? venueAmbient.other[0];

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

  // ─────────────────────── Android + no logo: emoji chip marker ───────────
  if (IS_ANDROID) {
    // Transparent padding gives the SDK stable bitmap bounds (see cluster
    // marker in map.tsx); the ring is an inset overlay because borderWidth on
    // the chip itself gets clipped by the view→bitmap snapshot.
    const outer = size + Math.round(size * 0.6);
    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => onPress(venue)}
        tracksViewChanges={tracking}
      >
        <View
          collapsable={false}
          style={[styles.wrapper, { width: outer, height: outer }]}
        >
          <View
            collapsable={false}
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: ambient,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
                borderRadius: radius - 1,
                borderWidth: ringWidth,
                borderColor: ringColor,
              }}
            />
            <Text style={{ fontSize: Math.round(size * 0.48) }}>{emoji}</Text>
          </View>
        </View>
      </Marker>
    );
  }

  // ─────────────────────────── iOS: custom view marker ────────────────────
  const pad = Math.round(size * 0.34);
  const outer = size + pad * 2;

  return (
    <Marker
      coordinate={coordinate}
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
            backgroundColor: hasLogo ? PURPLE : ambient,
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
            <Text style={{ fontSize: Math.round(size * 0.48) }}>{emoji}</Text>
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
