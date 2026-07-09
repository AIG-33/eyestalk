-- Community & pop-up venues + instant venue setup
--
-- 1) venues.venue_kind — 'official' (business owner), 'community' (user-added
--    place), 'popup' (temporary event venue, auto-expires).
-- 2) venues.expires_at — pop-up venues disappear from the map after this time.
-- 3) Auto-setup on venue creation: permanent QR code + venue_general chat are
--    created by trigger, so every venue is check-in-ready immediately.
-- 4) Token reward for adding a venue (first 3 venues per user).
-- 5) Read-only chat preview: anyone can read venue_general messages, so users
--    can see the vibe before checking in (posting still requires check-in via
--    participants insert + messages_insert sender check).

-- ============================================================
-- 1) New columns
-- ============================================================
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS venue_kind TEXT NOT NULL DEFAULT 'official'
    CHECK (venue_kind IN ('official', 'community', 'popup')),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_venues_expires_at
  ON venues (expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 2) Hide expired pop-ups from everyone (owner still sees own)
-- ============================================================
DROP POLICY IF EXISTS venues_select ON venues;
CREATE POLICY venues_select ON venues FOR SELECT USING (
  (is_active = true AND (expires_at IS NULL OR expires_at > now()))
  OR owner_id = auth.uid()
);

-- ============================================================
-- 3) Token reward type for adding a venue
-- ============================================================
ALTER TYPE token_transaction_type ADD VALUE IF NOT EXISTS 'venue_added_reward';

-- ============================================================
-- 4) Auto-setup trigger: QR code + general chat + reward
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
  SELECT count(*) INTO v_venue_count FROM venues WHERE owner_id = NEW.owner_id;
  IF v_venue_count <= 3 THEN
    UPDATE profiles SET token_balance = token_balance + 50 WHERE id = NEW.owner_id;
    INSERT INTO token_transactions (user_id, venue_id, amount, type, description)
    VALUES (NEW.owner_id, NEW.id, 50, 'venue_added_reward', 'Added venue ' || NEW.name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_venue_created ON venues;
CREATE TRIGGER trigger_on_venue_created
  AFTER INSERT ON venues
  FOR EACH ROW
  EXECUTE FUNCTION on_venue_created();

-- ============================================================
-- 5) Read-only preview of venue general chats before check-in
-- ============================================================
CREATE POLICY messages_select_venue_general ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id = messages.chat_id AND c.type = 'venue_general'
  ));
