import React from 'react';
import { View, Text, Image, StyleSheet, Platform, PixelRatio } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import type { MarkerSize } from '@/stores/ui.store';
import {
  VENUE_EMOJI,
  POPUP_EMOJI,
  POPUP_COLOR,
  POPUP_AMBIENT,
  isPopupVenue,
} from '@/lib/venue-constants';
import { VENUE_MARKER_ICONS, type MarkerIconState } from '@/lib/venue-marker-icons';
import { venueAmbient } from '@/theme';

/**
 * Venue marker — ONE size, controlled by the user's "map marker size" setting.
 *
 * Platform strategy (deliberate split):
 *  • Android — the Google Maps SDK + New Architecture snapshots custom <View>
 *    markers to a bitmap with broken bounds (verified on emulator: only the
 *    top-left corner survives). So Android NEVER uses view children — every
 *    marker is a native <Marker image>:
 *      – with logo: remote logo normalized to density-exact pixels via proxy
 *        (remote bitmaps draw at intrinsic pixel size);
 *      – without logo: pre-generated per-venue-type emoji chip PNG shipped in
 *        @1x/@2x/@3x density buckets (see scripts/generate-markers.mjs), so
 *        decodeResource picks the right bucket and the chip is exactly dp-sized.
 *        A single suffix-less PNG would land in mdpi and get blown up ×2–3.5.
 *  • iOS — custom <View> markers render perfectly, so we keep the richer look
 *    (logo/emoji + activity ring + count badge), sized in dp.
 */

const IS_ANDROID = Platform.OS === 'android';
const PURPLE = '#7C6FF7';

// Marker diameter in dp — shared by every variant so logo markers, emoji
// chips, iOS and Android all end up the exact same on-screen size.
const SIZE_DP: Record<MarkerSize, number> = { small: 34, medium: 44, large: 56 };

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
  /**
   * Must be passed as a prop (not derived internally): react-native-map-
   * clustering only treats children with a `coordinate` prop as clusterable
   * markers, and the spiderfier overrides it via cloneElement at high zoom.
   */
  coordinate: { latitude: number; longitude: number };
  isSelected: boolean;
  recentlyActive: boolean;
  /** User's marker-size preference. */
  sizeKey: MarkerSize;
  matchMode?: boolean;
  onPress: (v: VenueWithStats) => void;
}

function LiveVenueMarkerInner({
  venue,
  coordinate,
  isSelected,
  recentlyActive,
  sizeKey,
  matchMode = false,
  onPress,
}: Props) {
  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;
  const hasMatch = matchMode && venue.interest_matches > 0;
  const isPopup = isPopupVenue(venue);

  // ─────────────────────── Android: native image markers only ─────────────
  if (IS_ANDROID) {
    // Pop-up events get a distinct gold teardrop pin. A native pinColor marker
    // is safe on the New Architecture (no custom <View> to snapshot) and reads
    // as clearly different from the round venue-type emoji chips.
    if (isPopup) {
      return (
        <Marker
          coordinate={coordinate}
          onPress={() => onPress(venue)}
          stopPropagation
          tracksViewChanges={false}
          pinColor={POPUP_COLOR}
        />
      );
    }
    if (hasLogo) {
      // Remote bitmaps draw at intrinsic pixel size, so request the dp size
      // multiplied by the device density — same on-screen size as the chips.
      const px = PixelRatio.getPixelSizeForLayoutSize(SIZE_DP[sizeKey]);
      return (
        <Marker
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => onPress(venue)}
          stopPropagation
          tracksViewChanges={false}
          image={{ uri: proxiedLogo(venue.logo_url!, px) }}
        />
      );
    }

    const state: MarkerIconState = isSelected
      ? 'selected'
      : recentlyActive || hasActivity
        ? 'active'
        : 'default';
    const icons = VENUE_MARKER_ICONS[venue.type] ?? VENUE_MARKER_ICONS.other;
    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => onPress(venue)}
        stopPropagation
        tracksViewChanges={false}
        image={icons[sizeKey][state]}
      />
    );
  }

  // ─────────────────────────── iOS: custom view marker ────────────────────
  const size = SIZE_DP[sizeKey];
  const radius = Math.round(size * 0.28);
  // Pop-up events use a party emoji + amber tint so they pop against venues.
  const emoji = isPopup ? POPUP_EMOJI : VENUE_EMOJI[venue.type] || '📍';
  const ambient = isPopup
    ? POPUP_AMBIENT
    : (venueAmbient[venue.type]?.[0] ?? venueAmbient.other[0]);
  const pad = Math.round(size * 0.34);
  const outer = size + pad * 2;

  const ringColor = isSelected
    ? '#FFFFFF'
    : isPopup
      ? POPUP_COLOR
      : hasMatch
        ? '#FF6B9D'
        : recentlyActive
          ? '#00E5A0'
          : hasActivity
            ? 'rgba(0,229,160,0.8)'
            : 'rgba(255,255,255,0.5)';
  const ringWidth = isSelected || hasMatch || isPopup ? Math.max(2, size * 0.06) : hasActivity ? size * 0.05 : size * 0.035;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(venue)}
      stopPropagation
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
}

export const LiveVenueMarker = React.memo(LiveVenueMarkerInner);

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
