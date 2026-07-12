import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useActiveCheckin } from '@/hooks/use-checkin';
import type { CheckoutReason } from '@eyestalk/shared/constants';

// Reasons that were NOT initiated by the user tapping "Check out". These are the
// ones worth surfacing ("here's why you're no longer checked in").
const AUTO_REASONS: CheckoutReason[] = [
  'geofence_exit',
  'session_timeout',
  'venue_closed',
  'checked_in_elsewhere',
];

/**
 * Shows a one-time notice explaining WHY the user was automatically checked out of a
 * venue. Works for every auto check-out path — leaving the geofence (client), session
 * timeout / pop-up close (server edge function), etc. — because it reads the
 * `checkout_reason` recorded on the check-in row rather than guessing at the trigger.
 *
 * It watches the active check-in: when a previously-active check-in disappears, it
 * looks up that row's final status + reason and, if it ended automatically, alerts
 * the user. Manual check-outs are intentionally silent.
 */
export function useAutoCheckoutNotice() {
  const { data: activeCheckin } = useActiveCheckin();
  const { t } = useTranslation();

  const lastActiveIdRef = useRef<string | null>(activeCheckin?.id ?? null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentId = activeCheckin?.id ?? null;
    const previousId = lastActiveIdRef.current;
    lastActiveIdRef.current = currentId;

    // We only care about the moment an active check-in goes away.
    if (!previousId || previousId === currentId) return;
    if (notifiedIdsRef.current.has(previousId)) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('status, checkout_reason, venues(name)')
        .eq('id', previousId)
        .maybeSingle();

      if (cancelled || error || !data) return;
      if (data.status === 'active') return; // re-checked-in elsewhere / stale read

      const reason = (data.checkout_reason ?? null) as CheckoutReason | null;
      if (!reason || !AUTO_REASONS.includes(reason)) return;

      notifiedIdsRef.current.add(previousId);

      const venue = data.venues as { name?: string } | null | undefined;
      const venueName = venue?.name ?? '';

      Alert.alert(
        t('venue.autoCheckoutTitle'),
        t(`venue.checkoutReason.${reason}`, { venueName }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCheckin?.id, t]);
}
