import { getDistanceMeters } from '@/lib/geo';

export interface LaunchCity {
  key: string;
  /** Display name is resolved via i18n key `launchCities.${key}`. */
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Hyperlocal launch regions. The map boots into the first city and, when the
 * user is far from any venue, recenters on the nearest launch city that has
 * live venues — so new users always land on a populated map instead of an
 * empty neighborhood.
 */
export const LAUNCH_CITIES: LaunchCity[] = [
  { key: 'dubai', latitude: 25.145, longitude: 55.21, latitudeDelta: 0.38, longitudeDelta: 0.38 },
  { key: 'moscow', latitude: 55.7558, longitude: 37.6173, latitudeDelta: 0.3, longitudeDelta: 0.3 },
];

export const PRIMARY_LAUNCH_CITY = LAUNCH_CITIES[0];

/** Venues within this range of a city's center count as "in" that city. */
const CITY_RADIUS_METERS = 80_000;

export function nearestLaunchCityWithVenues(
  venues: { latitude: number; longitude: number }[],
  from?: { latitude: number; longitude: number } | null,
): LaunchCity | null {
  const citiesWithVenues = LAUNCH_CITIES.filter((city) =>
    venues.some(
      (v) =>
        getDistanceMeters(
          city.latitude, city.longitude,
          Number(v.latitude), Number(v.longitude),
        ) <= CITY_RADIUS_METERS,
    ),
  );
  if (citiesWithVenues.length === 0) return null;
  if (!from) return citiesWithVenues[0];

  return citiesWithVenues.reduce((best, city) =>
    getDistanceMeters(from.latitude, from.longitude, city.latitude, city.longitude) <
    getDistanceMeters(from.latitude, from.longitude, best.latitude, best.longitude)
      ? city
      : best,
  );
}
