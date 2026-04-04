const R = 6371e3;
const RAD = Math.PI / 180;

/** Map region from react-native-maps (center + span). */
export type MapRegionBounds = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** True if a point lies inside the visible map rectangle (ignores date-line wrap). */
export function isLatLngInMapRegion(
  lat: number,
  lng: number,
  region: MapRegionBounds,
): boolean {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  const latOk =
    lat >= region.latitude - halfLat && lat <= region.latitude + halfLat;
  const lngOk =
    lng >= region.longitude - halfLng && lng <= region.longitude + halfLng;
  return latOk && lngOk;
}

export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number, lang: string = 'en'): string {
  const isRu = lang === 'ru';
  if (meters < 1000) {
    return `${Math.round(meters)} ${isRu ? 'м' : 'm'}`;
  }
  return `${(meters / 1000).toFixed(1)} ${isRu ? 'км' : 'km'}`;
}
