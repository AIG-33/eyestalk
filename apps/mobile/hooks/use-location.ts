import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mounted) {
          setError('Location permission denied');
          setLoading(false);
        }
        return;
      }

      // Show map immediately on Android (and iOS) using last known fix, then refine with GPS.
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (mounted && last?.coords) {
          setLocation({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          });
          setLoading(false);
        }
      } catch {
        /* ignore */
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy:
            Platform.OS === 'android'
              ? Location.Accuracy.Low
              : Location.Accuracy.Balanced,
        });

        if (mounted) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    getLocation();
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      setError('Failed to get location');
    }
    setLoading(false);
  };

  return { location, error, loading, refresh };
}
