import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '@/hooks/use-location';
import { useNearbyVenues } from '@/hooks/use-venues';
import { useActiveCheckin } from '@/hooks/use-checkin';
import { VenueTypeIcon } from '@/components/venue/venue-type-icon';

export default function MapScreen() {
  const { t } = useTranslation();
  const { location, loading: locationLoading } = useLocation();
  const { data: venues, isLoading: venuesLoading } = useNearbyVenues(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );
  const { data: activeCheckin } = useActiveCheckin();

  if (locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>EyesTalk</Text>
        {activeCheckin && (
          <TouchableOpacity
            style={styles.activeCheckinBadge}
            onPress={() => router.push(`/(app)/venue/${activeCheckin.venue_id}` as any)}
          >
            <View style={styles.activeDot} />
            <Text style={styles.activeCheckinText}>
              {(activeCheckin as any).venues?.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {location && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {venues?.map((venue) => (
            <Marker
              key={venue.id}
              coordinate={{
                latitude: Number(venue.latitude),
                longitude: Number(venue.longitude),
              }}
              title={venue.name}
              description={
                venue.active_checkins > 0
                  ? t('map.peopleInside', { count: venue.active_checkins })
                  : undefined
              }
              onCalloutPress={() => router.push(`/(app)/venue/${venue.id}` as any)}
            >
              <VenueTypeIcon type={venue.type} count={venue.active_checkins} />
            </Marker>
          ))}
        </MapView>
      )}

      {venuesLoading && (
        <View style={styles.venueLoadingOverlay}>
          <ActivityIndicator size="small" color="#6C5CE7" />
        </View>
      )}

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/(app)/venue/check-in' as any)}
      >
        <Text style={styles.scanButtonIcon}>📷</Text>
        <Text style={styles.scanButtonText}>{t('venue.scanQR')}</Text>
      </TouchableOpacity>

      {venues && venues.length > 0 && (
        <View style={styles.venueList}>
          {venues.slice(0, 3).map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              onPress={() => router.push(`/(app)/venue/${venue.id}` as any)}
            >
              <View style={styles.venueCardLeft}>
                <Text style={styles.venueCardName}>{venue.name}</Text>
                <Text style={styles.venueCardType}>
                  {t(`venueTypes.${venue.type}`, { defaultValue: venue.type })}
                </Text>
              </View>
              <View style={styles.venueCardRight}>
                {venue.active_checkins > 0 && (
                  <View style={styles.peopleBadge}>
                    <Text style={styles.peopleBadgeText}>
                      {venue.active_checkins} 👤
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0F0E17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A7A9BE',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFE',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  activeCheckinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  activeCheckinText: {
    color: '#FFFFFE',
    fontSize: 13,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  venueLoadingOverlay: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,14,23,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanButton: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanButtonIcon: {
    fontSize: 18,
  },
  scanButtonText: {
    color: '#FFFFFE',
    fontSize: 14,
    fontWeight: '700',
  },
  venueList: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },
  venueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 25, 41, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2940',
  },
  venueCardLeft: {
    flex: 1,
  },
  venueCardName: {
    color: '#FFFFFE',
    fontSize: 16,
    fontWeight: '700',
  },
  venueCardType: {
    color: '#A7A9BE',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  venueCardRight: {
    marginLeft: 12,
  },
  peopleBadge: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  peopleBadgeText: {
    color: '#FFFFFE',
    fontSize: 12,
    fontWeight: '600',
  },
});
