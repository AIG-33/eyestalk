import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { getDistanceMeters } from '@/lib/geo';
import { useActiveCheckin, useCheckin } from '@/hooks/use-checkin';

const OUTSIDE_READINGS_REQUIRED = 2;

/**
 * While the user has an active check-in, watches foreground location and checks out
 * with status `geofence_checkout` when they are farther than the venue's geofence radius
 * (confirmed by consecutive readings outside, to reduce GPS jitter).
 *
 * Only runs when the venue's `checkout_policy` includes `geofence_exit` (the default).
 * The user-facing notice is shown centrally by `useAutoCheckoutNotice`, which reads
 * the recorded `checkout_reason` — so this hook only performs the check-out.
 *
 * Requires location permission; works when the app is in foreground (When In Use).
 */
export function useGeofenceAutoCheckout() {
  const { data: activeCheckin } = useActiveCheckin();
  const { checkoutMutation } = useCheckin();
  const checkinRef = useRef(activeCheckin);
  checkinRef.current = activeCheckin;

  const mutateCheckoutRef = useRef(checkoutMutation.mutate);
  mutateCheckoutRef.current = checkoutMutation.mutate;

  const outsideStreakRef = useRef(0);
  const checkoutInFlightRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!activeCheckin?.id) {
      outsideStreakRef.current = 0;
      return;
    }

    const venue = activeCheckin.venues as
      | {
          name?: string;
          latitude?: number | string | null;
          longitude?: number | string | null;
          geofence_radius?: number | string | null;
          checkout_policy?: string[] | null;
        }
      | null
      | undefined;

    if (!venue) return;

    // Respect the venue's auto check-out policy: only leave-the-zone check-out when
    // the owner enabled `geofence_exit`. Missing policy = legacy default (enabled).
    const policy = venue.checkout_policy;
    if (Array.isArray(policy) && !policy.includes('geofence_exit')) return;

    const vLat = Number(venue.latitude);
    const vLng = Number(venue.longitude);
    if (!Number.isFinite(vLat) || !Number.isFinite(vLng)) return;

    const radiusM = Math.max(10, Number(venue.geofence_radius) || 100);
    const checkinId = activeCheckin.id;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const tryCheckout = () => {
      if (cancelled || checkoutInFlightRef.current) return;
      const cur = checkinRef.current;
      if (!cur || cur.id !== checkinId) return;
      if (appStateRef.current !== 'active') return;

      checkoutInFlightRef.current = true;
      mutateCheckoutRef.current(
        { checkinId, status: 'geofence_checkout', reason: 'geofence_exit' },
        {
          onSettled: () => {
            checkoutInFlightRef.current = false;
          },
          onSuccess: () => {
            outsideStreakRef.current = 0;
          },
        },
      );
    };

    const pollLocation = async () => {
      if (cancelled) return;
      const cur = checkinRef.current;
      if (!cur || cur.id !== checkinId) return;
      if (checkoutInFlightRef.current) return;
      if (appStateRef.current !== 'active') return;

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        const d = getDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          vLat,
          vLng,
        );

        if (d > radiusM) {
          outsideStreakRef.current += 1;
          if (outsideStreakRef.current >= OUTSIDE_READINGS_REQUIRED) {
            tryCheckout();
          }
        } else {
          outsideStreakRef.current = 0;
        }
      } catch {
        /* GPS throttled or permission revoked */
      }
    };

    void pollLocation();
    intervalId = setInterval(() => {
      void pollLocation();
    }, 20_000);

    return () => {
      cancelled = true;
      outsideStreakRef.current = 0;
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    activeCheckin?.id,
    (activeCheckin?.venues as { latitude?: unknown } | null | undefined)?.latitude,
    (activeCheckin?.venues as { longitude?: unknown } | null | undefined)?.longitude,
    (activeCheckin?.venues as { geofence_radius?: unknown } | null | undefined)?.geofence_radius,
    (activeCheckin?.venues as { name?: string } | null | undefined)?.name,
  ]);
}
