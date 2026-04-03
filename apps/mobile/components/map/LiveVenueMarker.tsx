import React, { useState, useEffect } from 'react';
import { View, Text, Image, Platform, PixelRatio } from 'react-native';
import { Marker } from 'react-native-maps';
import type { VenueWithStats } from '@/hooks/use-venues';
import { VENUE_EMOJI } from '@/lib/venue-constants';

const MAX_BITMAP_PX = 96;
const BASE_MARKER_SIZE =
  Platform.OS === 'android'
    ? Math.min(44, Math.floor(MAX_BITMAP_PX / PixelRatio.get()))
    : 44;
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
  const [captured, setCaptured] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasLogo = !!venue.logo_url;
  const hasActivity = venue.active_checkins > 0;

  useEffect(() => {
    const delay = hasLogo ? 2000 : 1200;
    const t = setTimeout(() => setCaptured(true), delay);
    return () => clearTimeout(t);
  }, [hasLogo]);

  const emoji = VENUE_EMOJI[venue.type] || '📍';
  const markerSize = BASE_MARKER_SIZE;

  const borderColor = isSelected
    ? '#FFFFFF'
    : recentlyActive
      ? '#00E5A0'
      : hasActivity
        ? 'rgba(0,229,160,0.7)'
        : 'rgba(255,255,255,0.4)';

  const borderWidth = isSelected ? 2.5 : hasActivity ? 2 : 1.5;

  return (
    <Marker
      coordinate={{
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
      }}
      onPress={() => onPress(venue)}
      onSelect={() => onPress(venue)}
      tracksViewChanges={
        Platform.OS === 'ios' || !captured || (hasLogo && !imgLoaded)
      }
    >
      <View
        collapsable={false}
        style={{
          width: markerSize + 20,
          height: markerSize + 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasActivity && (
          <View
            style={{
              position: 'absolute',
              width: markerSize + 10,
              height: markerSize + 10,
              borderRadius: (markerSize + 10) / 2,
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

        <View
          style={{
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
            backgroundColor: '#7C6FF7',
            borderWidth,
            borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {hasLogo ? (
            <Image
              source={{ uri: venue.logo_url! }}
              style={{
                width: markerSize - 2,
                height: markerSize - 2,
                borderRadius: markerSize / 2,
              }}
              resizeMode="cover"
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <Text style={{ fontSize: EMOJI_FONT }}>{emoji}</Text>
          )}
        </View>

        {hasActivity && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
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
