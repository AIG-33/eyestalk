import React from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { LogoMark } from '@/components/ui/logo-mark';

const IS_ANDROID = Platform.OS === 'android';

/**
 * Map markers strategy:
 *
 *   ANDROID — native image markers via <Marker image={...} />. The Android
 *   Google Maps SDK + New Architecture clips custom <View> markers (the
 *   bitmap bounds are computed too small, cutting the top/right). Native
 *   image markers are drawn directly by the SDK and never clipped.
 *     • venue has its own logo  → image={{ uri }} (the SDK loads it)
 *     • no logo                 → our pre-rendered EyesTalk pin PNG
 *
 *   iOS — custom <View> markers render correctly, so we keep the richer
 *   look (logo, activity ring, check-in count badge).
 */

const ANDROID_FALLBACK = {
  default: require('@/assets/markers/venue.png'),
  selected: require('@/assets/markers/venue-selected.png'),
  active: require('@/assets/markers/venue-active.png'),
};

/** Marker logo px size — controls how large the SDK draws the native image.
 *  Android draws <Marker image> at the bitmap's intrinsic pixel size, so we
 *  normalize EVERY logo to exactly this many px (see sizedLogo). Kept small so
 *  venue markers sit just slightly above Google's own POI pins. */
const ANDROID_LOGO_PX = 72;
const MARKER = 44; // iOS view marker diameter (dp)
const PAD = 12;
const OUTER = MARKER + PAD * 2;
const PURPLE = '#7C6FF7';

/**
 * Normalize any logo URL to a fixed-size circular PNG so every Android marker
 * is identical in size — regardless of the source image's real dimensions.
 *
 * The native Google Maps SDK draws `<Marker image={{ uri }}>` at the bitmap's
 * intrinsic pixel size. Relying on a `?size=` query only works for backends
 * that honour it (e.g. dicebear); arbitrary logos (Supabase storage, brand
 * PNGs) ignore it and render huge. We route them all through the weserv image
 * proxy with explicit w/h, guaranteeing a uniform ANDROID_LOGO_PX on screen.
 */
function sizedLogo(url: string): { uri: string } {
  const src = url.replace(/^https?:\/\//, '');
  const uri =
    `https://images.weserv.nl/?url=ssl:${encodeURIComponent(src)}` +
    `&w=${ANDROID_LOGO_PX}&h=${ANDROID_LOGO_PX}&fit=cover&output=png`;
  return { uri };
}

interface Props {
  venue: VenueWithStats;
  isSelected: boolean;
  recentlyActive: boolean;
  /** When true (Matches mode), emphasize venues with matching people. iOS only. */
  matchMode?: boolean;
  onPress: (v: VenueWithStats) => void;
}

export const LiveVenueMarker = React.memo(function LiveVenueMarker({
  venue,
  isSelected,
  recentlyActive,
  matchMode = false,
  onPress,
}: Props) {
  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;

  const coordinate = {
    latitude: Number(venue.latitude),
    longitude: Number(venue.longitude),
  };

  // ── Android: native image marker (no view → bitmap, no clipping) ──
  if (IS_ANDROID) {
    const image = hasLogo
      ? sizedLogo(venue.logo_url!)
      : isSelected
        ? ANDROID_FALLBACK.selected
        : recentlyActive || hasActivity
          ? ANDROID_FALLBACK.active
          : ANDROID_FALLBACK.default;

    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => onPress(venue)}
        image={image}
        tracksViewChanges={false}
      />
    );
  }

  // ── iOS: custom View marker (logo + ring + count badge) ──
  const hasMatch = matchMode && venue.interest_matches > 0;
  const ringColor = isSelected
    ? '#FFFFFF'
    : hasMatch
      ? '#FF6B9D'
      : recentlyActive
        ? '#00E5A0'
        : hasActivity
          ? 'rgba(0,229,160,0.75)'
          : 'rgba(255,255,255,0.45)';
  const ringWidth = isSelected ? 2.5 : hasMatch ? 2.5 : hasActivity ? 2 : 1.5;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(venue)}
      tracksViewChanges
    >
      <View style={styles.wrapper}>
        {hasActivity && (
          <View
            pointerEvents="none"
            style={[
              styles.activityHalo,
              {
                backgroundColor: recentlyActive
                  ? 'rgba(0,229,160,0.25)'
                  : 'rgba(0,229,160,0.12)',
              },
            ]}
          />
        )}

        <View
          style={[styles.badge, { borderColor: ringColor, borderWidth: ringWidth }]}
        >
          {hasLogo ? (
            <Image
              source={{ uri: venue.logo_url! }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <LogoMark size={MARKER * 0.62} color={PURPLE} pupilColor={PURPLE} />
          )}
        </View>

        {hasActivity && (
          <View style={styles.countBadge}>
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
    width: OUTER,
    height: OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activityHalo: {
    position: 'absolute',
    width: MARKER + 10,
    height: MARKER + 10,
    borderRadius: (MARKER + 10) / 2,
  },
  badge: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
  },
  countBadge: {
    position: 'absolute',
    top: PAD - 5,
    right: PAD - 5,
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
