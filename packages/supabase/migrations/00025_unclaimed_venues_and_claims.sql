-- Unclaimed (imported) venues + ownership claims
--
-- 1) venues.venue_kind gains 'unclaimed' — venues bulk-imported from open POI
--    data (Overture Maps / Foursquare OS Places) that have no owner yet.
--    They are fully functional (check-in, chat, people) from day one.
-- 2) venues.owner_id becomes nullable; imported venues have no owner until
--    a business claims them.
-- 3) venues.external_source / external_id — provenance of imported rows,
--    unique per source so re-imports are idempotent.
-- 4) profiles.is_admin — platform admins who review ownership claims.
-- 5) venue_claims — "I'm the owner" requests with contact info + photo proof.
--    Approval transfers ownership and upgrades the venue to 'official'.
-- 6) Private storage bucket for claim proof photos.

-- ============================================================
-- 1) venue_kind: allow 'unclaimed'
-- ============================================================
ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_venue_kind_check;
ALTER TABLE venues ADD CONSTRAINT venues_venue_kind_check
  CHECK (venue_kind IN ('official', 'community', 'popup', 'unclaimed'));

-- ============================================================
-- 2) Imported venues have no owner until claimed
-- ============================================================
ALTER TABLE venues ALTER COLUMN owner_id DROP NOT NULL;

-- ============================================================
-- 3) Provenance of imported venues (idempotent re-imports)
-- ============================================================
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_external_ref_unique;
ALTER TABLE venues ADD CONSTRAINT venues_external_ref_unique
  UNIQUE (external_source, external_id);

-- ============================================================
-- 4) Venue-creation trigger must tolerate ownerless venues
--    (no token reward for bulk imports)
-- ============================================================
CREATE OR REPLACE FUNCTION on_venue_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venue_count INTEGER;
BEGIN
  -- Every venue gets a permanent QR code immediately (no manual setup step).
  INSERT INTO qr_codes (venue_id, code, type)
  VALUES (
    NEW.id,
    'EYESTALK-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8)) ||
      '-' || upper(to_hex((extract(epoch FROM now()))::bigint)),
    'permanent'
  );

  -- General chat exists from second zero so previews aren't empty-by-error.
  INSERT INTO chats (venue_id, type, name)
  VALUES (NEW.id, 'venue_general', 'General');

  -- Reward the first 3 venues a user adds (anti-farm cap).
  -- Imported venues have no owner — nothing to reward.
  IF NEW.owner_id IS NOT NULL THEN
    SELECT count(*) INTO v_venue_count FROM venues WHERE owner_id = NEW.owner_id;
    IF v_venue_count <= 3 THEN
      UPDATE profiles SET token_balance = token_balance + 50 WHERE id = NEW.owner_id;
      INSERT INTO token_transactions (user_id, venue_id, amount, type, description)
      VALUES (NEW.owner_id, NEW.id, 50, 'venue_added_reward', 'Added venue ' || NEW.name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 5) Platform admins (review ownership claims)
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;

-- ============================================================
-- 6) Ownership claims
-- ============================================================
CREATE TABLE IF NOT EXISTS venue_claims (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id      UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  contact_phone VARCHAR(30),
  contact_email VARCHAR(200),
  message       TEXT,
  -- Storage path inside the private 'claim-proofs' bucket.
  proof_path    VARCHAR(500),
  -- Client-reported distance to the venue at submission time (advisory).
  distance_m    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES profiles(id)
);

-- One open claim per user per venue.
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_claims_pending_unique
  ON venue_claims (venue_id, user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_venue_claims_status
  ON venue_claims (status, created_at DESC);

ALTER TABLE venue_claims ENABLE ROW LEVEL SECURITY;

-- Users create claims for themselves, only on venues that aren't officially owned.
CREATE POLICY venue_claims_insert ON venue_claims FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = venue_id
        AND (v.owner_id IS NULL OR v.venue_kind <> 'official')
        AND (v.owner_id IS DISTINCT FROM auth.uid())
    )
  );

-- Users see their own claims; admins see all.
CREATE POLICY venue_claims_select ON venue_claims FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

-- ============================================================
-- 7) Claim review — admin-only, transfers ownership on approval
-- ============================================================
CREATE OR REPLACE FUNCTION review_venue_claim(p_claim_id UUID, p_approve BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim venue_claims%ROWTYPE;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can review claims';
  END IF;

  SELECT * INTO v_claim FROM venue_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;
  IF v_claim.status <> 'pending' THEN
    RAISE EXCEPTION 'Claim is already reviewed';
  END IF;

  UPDATE venue_claims
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_claim_id;

  IF p_approve THEN
    UPDATE venues
    SET owner_id = v_claim.user_id,
        venue_kind = 'official'
    WHERE id = v_claim.venue_id;

    -- The venue now has a verified owner; competing claims are moot.
    UPDATE venue_claims
    SET status = 'rejected',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE venue_id = v_claim.venue_id
      AND status = 'pending'
      AND id <> p_claim_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION review_venue_claim(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION review_venue_claim(UUID, BOOLEAN) TO authenticated;

-- ============================================================
-- 8) Private bucket for claim proof photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim-proofs',
  'claim-proofs',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Claim proof upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'claim-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Claim proof read own or admin" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'claim-proofs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR is_platform_admin()
    )
  );
