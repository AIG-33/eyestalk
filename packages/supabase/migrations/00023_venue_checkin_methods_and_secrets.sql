-- Venue check-in method selection + WiFi / code access secrets
--
-- A venue owner can now choose which check-in methods are accepted (QR, geofence,
-- code), set a manual check-in code, and store WiFi credentials. The WiFi password
-- is only revealed to users who are actively checked in (or to the owner).

-- ============================================================
-- 1) Which check-in methods a venue accepts (public, non-sensitive)
-- ============================================================
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS checkin_methods TEXT[] NOT NULL DEFAULT ARRAY['qr', 'geofence'];

-- Network name (SSID) is already public on venues.wifi_ssid.

-- ============================================================
-- 2) Per-venue secrets: check-in code + WiFi password (owner-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS venue_secrets (
  venue_id      UUID PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
  checkin_code  VARCHAR(50),
  wifi_password VARCHAR(200),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE venue_secrets ENABLE ROW LEVEL SECURITY;

-- Only the venue owner can read / write secrets directly.
CREATE POLICY venue_secrets_select_owner ON venue_secrets FOR SELECT
  USING (EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_id = auth.uid()));

CREATE POLICY venue_secrets_insert_owner ON venue_secrets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_id = auth.uid()));

CREATE POLICY venue_secrets_update_owner ON venue_secrets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_id = auth.uid()));

CREATE TRIGGER trigger_venue_secrets_updated_at
  BEFORE UPDATE ON venue_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3) Reveal the WiFi password only after an active check-in (or to the owner)
-- ============================================================
CREATE OR REPLACE FUNCTION venue_wifi_password(p_venue_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_pwd TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Owner can always see it.
  IF EXISTS (SELECT 1 FROM venues v WHERE v.id = p_venue_id AND v.owner_id = v_uid) THEN
    SELECT wifi_password INTO v_pwd FROM venue_secrets WHERE venue_id = p_venue_id;
    RETURN v_pwd;
  END IF;

  -- Checked-in users can see it.
  IF EXISTS (
    SELECT 1 FROM checkins c
    WHERE c.user_id = v_uid
      AND c.venue_id = p_venue_id
      AND c.status = 'active'
      AND c.expires_at > now()
  ) THEN
    SELECT wifi_password INTO v_pwd FROM venue_secrets WHERE venue_id = p_venue_id;
    RETURN v_pwd;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION venue_wifi_password(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION venue_wifi_password(UUID) TO authenticated;
