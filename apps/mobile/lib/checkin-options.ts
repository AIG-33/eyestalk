import type { CheckinMethod, CheckoutPolicy } from '@eyestalk/shared/constants';
import { Ionicons } from '@expo/vector-icons';

type IonName = keyof typeof Ionicons.glyphMap;

export interface CheckinMethodOption {
  key: CheckinMethod;
  icon: IonName;
  /** i18n key under `checkinMethods.*` for the label */
  labelKey: string;
  /** i18n key under `checkinMethods.*` for the one-line hint */
  hintKey: string;
}

export interface CheckoutPolicyOption {
  key: CheckoutPolicy;
  icon: IonName;
  /** i18n key under `checkoutPolicies.*` for the label */
  labelKey: string;
  /** i18n key under `checkoutPolicies.*` for the one-line hint */
  hintKey: string;
  /** `manual_only` is exclusive — selecting it clears the auto policies (and vice-versa). */
  exclusive?: boolean;
}

// Only the methods the check-in server actually verifies end-to-end (qr / geofence /
// code). NFC and invite-link check-in are intentionally not offered here yet because
// the server route can't validate them — surfacing them would create dead options.
export const CHECKIN_METHOD_OPTIONS: CheckinMethodOption[] = [
  { key: 'geofence', icon: 'location', labelKey: 'checkinMethods.geofence', hintKey: 'checkinMethods.geofenceHint' },
  { key: 'qr', icon: 'qr-code', labelKey: 'checkinMethods.qr', hintKey: 'checkinMethods.qrHint' },
  { key: 'code', icon: 'keypad', labelKey: 'checkinMethods.code', hintKey: 'checkinMethods.codeHint' },
];

export const CHECKOUT_POLICY_OPTIONS: CheckoutPolicyOption[] = [
  { key: 'geofence_exit', icon: 'walk', labelKey: 'checkoutPolicies.geofence_exit', hintKey: 'checkoutPolicies.geofence_exitHint' },
  { key: 'session_timeout', icon: 'time', labelKey: 'checkoutPolicies.session_timeout', hintKey: 'checkoutPolicies.session_timeoutHint' },
  { key: 'venue_close', icon: 'flag', labelKey: 'checkoutPolicies.venue_close', hintKey: 'checkoutPolicies.venue_closeHint' },
  { key: 'manual_only', icon: 'hand-left', labelKey: 'checkoutPolicies.manual_only', hintKey: 'checkoutPolicies.manual_onlyHint', exclusive: true },
];

/**
 * Applies the exclusive-selection rule for auto check-out policies:
 *  - toggling `manual_only` on clears every other policy;
 *  - toggling any auto policy on clears `manual_only`.
 * Always returns a non-empty list (falls back to the toggled key).
 */
export function toggleCheckoutPolicy(
  current: CheckoutPolicy[],
  key: CheckoutPolicy,
): CheckoutPolicy[] {
  const has = current.includes(key);
  const isExclusive = key === 'manual_only';

  if (has) {
    const next = current.filter((p) => p !== key);
    return next.length > 0 ? next : [key];
  }

  if (isExclusive) return ['manual_only'];
  return [...current.filter((p) => p !== 'manual_only'), key];
}

/** Multiselect toggle that keeps at least one method selected. */
export function toggleCheckinMethod(
  current: CheckinMethod[],
  key: CheckinMethod,
): CheckinMethod[] {
  const has = current.includes(key);
  if (has) {
    const next = current.filter((m) => m !== key);
    return next.length > 0 ? next : current;
  }
  return [...current, key];
}
