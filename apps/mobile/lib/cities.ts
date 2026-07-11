import { getDistanceMeters } from '@/lib/geo';

/**
 * City assignment for the "All venues" list filter.
 *
 * The `venues` table has no `city` column and imported rows have wildly
 * inconsistent `address` strings (different languages, ordering, missing
 * tokens), so parsing the address is unreliable. Every venue *does* have exact
 * coordinates, so we assign each venue to the nearest known city within
 * CITY_MATCH_RADIUS_METERS. Anything farther than that (or in a place we don't
 * list) falls into an "Other" bucket. This is deterministic, language-agnostic
 * and needs no schema change.
 */
export interface City {
  key: string;
  name: string;
  nameRu: string;
  latitude: number;
  longitude: number;
}

/** A venue counts as "in" a city if it's within this range of the city center. */
export const CITY_MATCH_RADIUS_METERS = 150_000;

/**
 * Curated set of major / tourism cities the venue dataset is likely to cover.
 * Extend freely — the filter only surfaces cities that actually have venues.
 */
export const CITIES: City[] = [
  // Gulf
  { key: 'dubai', name: 'Dubai', nameRu: 'Дубай', latitude: 25.2048, longitude: 55.2708 },
  { key: 'abu_dhabi', name: 'Abu Dhabi', nameRu: 'Абу-Даби', latitude: 24.4539, longitude: 54.3773 },
  { key: 'doha', name: 'Doha', nameRu: 'Доха', latitude: 25.2854, longitude: 51.531 },
  { key: 'riyadh', name: 'Riyadh', nameRu: 'Эр-Рияд', latitude: 24.7136, longitude: 46.6753 },
  // Russia / CIS
  { key: 'moscow', name: 'Moscow', nameRu: 'Москва', latitude: 55.7558, longitude: 37.6173 },
  { key: 'saint_petersburg', name: 'Saint Petersburg', nameRu: 'Санкт-Петербург', latitude: 59.9311, longitude: 30.3609 },
  { key: 'sochi', name: 'Sochi', nameRu: 'Сочи', latitude: 43.5855, longitude: 39.7231 },
  { key: 'kazan', name: 'Kazan', nameRu: 'Казань', latitude: 55.8304, longitude: 49.0661 },
  { key: 'yerevan', name: 'Yerevan', nameRu: 'Ереван', latitude: 40.1792, longitude: 44.4991 },
  { key: 'tbilisi', name: 'Tbilisi', nameRu: 'Тбилиси', latitude: 41.7151, longitude: 44.8271 },
  { key: 'almaty', name: 'Almaty', nameRu: 'Алматы', latitude: 43.222, longitude: 76.8512 },
  { key: 'baku', name: 'Baku', nameRu: 'Баку', latitude: 40.4093, longitude: 49.8671 },
  { key: 'istanbul', name: 'Istanbul', nameRu: 'Стамбул', latitude: 41.0082, longitude: 28.9784 },
  // Europe
  { key: 'london', name: 'London', nameRu: 'Лондон', latitude: 51.5074, longitude: -0.1278 },
  { key: 'paris', name: 'Paris', nameRu: 'Париж', latitude: 48.8566, longitude: 2.3522 },
  { key: 'barcelona', name: 'Barcelona', nameRu: 'Барселона', latitude: 41.3874, longitude: 2.1686 },
  { key: 'madrid', name: 'Madrid', nameRu: 'Мадрид', latitude: 40.4168, longitude: -3.7038 },
  { key: 'rome', name: 'Rome', nameRu: 'Рим', latitude: 41.9028, longitude: 12.4964 },
  { key: 'milan', name: 'Milan', nameRu: 'Милан', latitude: 45.4642, longitude: 9.19 },
  { key: 'berlin', name: 'Berlin', nameRu: 'Берлин', latitude: 52.52, longitude: 13.405 },
  { key: 'amsterdam', name: 'Amsterdam', nameRu: 'Амстердам', latitude: 52.3676, longitude: 4.9041 },
  { key: 'lisbon', name: 'Lisbon', nameRu: 'Лиссабон', latitude: 38.7223, longitude: -9.1393 },
  { key: 'prague', name: 'Prague', nameRu: 'Прага', latitude: 50.0755, longitude: 14.4378 },
  { key: 'vienna', name: 'Vienna', nameRu: 'Вена', latitude: 48.2082, longitude: 16.3738 },
  // Asia
  { key: 'bangkok', name: 'Bangkok', nameRu: 'Бангкок', latitude: 13.7563, longitude: 100.5018 },
  { key: 'phuket', name: 'Phuket', nameRu: 'Пхукет', latitude: 7.8804, longitude: 98.3923 },
  { key: 'bali', name: 'Bali', nameRu: 'Бали', latitude: -8.4095, longitude: 115.1889 },
  { key: 'singapore', name: 'Singapore', nameRu: 'Сингапур', latitude: 1.3521, longitude: 103.8198 },
  { key: 'tokyo', name: 'Tokyo', nameRu: 'Токио', latitude: 35.6762, longitude: 139.6503 },
  { key: 'seoul', name: 'Seoul', nameRu: 'Сеул', latitude: 37.5665, longitude: 126.978 },
  { key: 'hong_kong', name: 'Hong Kong', nameRu: 'Гонконг', latitude: 22.3193, longitude: 114.1694 },
  // Americas
  { key: 'new_york', name: 'New York', nameRu: 'Нью-Йорк', latitude: 40.7128, longitude: -74.006 },
  { key: 'los_angeles', name: 'Los Angeles', nameRu: 'Лос-Анджелес', latitude: 34.0522, longitude: -118.2437 },
  { key: 'miami', name: 'Miami', nameRu: 'Майами', latitude: 25.7617, longitude: -80.1918 },
  // Africa
  { key: 'cairo', name: 'Cairo', nameRu: 'Каир', latitude: 30.0444, longitude: 31.2357 },
];

export interface CityMatch {
  key: string;
  name: string;
  nameRu: string;
}

/** Key used to bucket venues that aren't near any listed city. */
export const OTHER_CITY_KEY = '__other__';

/** Nearest listed city within CITY_MATCH_RADIUS_METERS, or null if none. */
export function nearestCity(latitude: number, longitude: number): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of CITIES) {
    const d = getDistanceMeters(latitude, longitude, city.latitude, city.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  if (!best || bestDist > CITY_MATCH_RADIUS_METERS) return null;
  return best;
}

/** Localized display name for a city key ('other' handled by the caller). */
export function cityDisplayName(city: City, lang: string): string {
  return lang === 'ru' ? city.nameRu : city.name;
}
