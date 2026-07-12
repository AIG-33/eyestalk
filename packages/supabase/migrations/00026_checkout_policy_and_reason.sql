-- Configurable auto check-out + recorded check-out reason
--
-- 1) venues.checkout_policy — which automatic check-out policies a venue uses.
--    Multi-value TEXT[] so an owner can combine several policies:
--      - 'geofence_exit'    : check the user out when they leave the geofence
--      - 'session_timeout'  : check the user out after CHECKIN_DURATION_HOURS (expires_at)
--      - 'venue_close'       : check the user out when a pop-up venue expires (venues.expires_at)
--      - 'manual_only'       : never auto check-out (user leaves manually)
--    Default keeps today's behaviour (geofence + session timeout).
--
-- 2) checkins.checkout_reason — why a check-in ended, so we can tell the user.
--    Values: 'geofence_exit' | 'session_timeout' | 'venue_closed'
--            | 'checked_in_elsewhere' | 'manual' (NULL for still-active check-ins).
--
-- This migration is strictly ADDITIVE (ADD COLUMN ... DEFAULT / nullable). It does
-- not drop, rename, or rewrite existing data and is safe to apply to production.

-- ============================================================
-- 1) Per-venue auto check-out policy
-- ============================================================
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS checkout_policy TEXT[] NOT NULL
    DEFAULT ARRAY['geofence_exit', 'session_timeout'];

-- ============================================================
-- 2) Reason a check-in was ended (shown to the user on auto check-out)
-- ============================================================
ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS checkout_reason TEXT;
