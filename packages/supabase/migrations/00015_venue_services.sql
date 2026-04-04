-- Bookable venue services (offers) with time slots and token payment

ALTER TYPE token_transaction_type ADD VALUE IF NOT EXISTS 'service_booking';

CREATE TYPE venue_service_slot_status AS ENUM ('scheduled', 'cancelled');
CREATE TYPE venue_service_booking_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE venue_services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id          UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  price_tokens      INTEGER NOT NULL DEFAULT 0 CHECK (price_tokens >= 0),
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 24 * 60),
  capacity_per_slot INTEGER NOT NULL DEFAULT 1 CHECK (capacity_per_slot >= 1 AND capacity_per_slot <= 100),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE venue_service_slots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES venue_services(id) ON DELETE CASCADE,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  status     venue_service_slot_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT venue_service_slots_time_order CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX idx_venue_service_slots_no_overlap_start
  ON venue_service_slots (service_id, starts_at)
  WHERE status = 'scheduled';

CREATE INDEX idx_venue_service_slots_service_time
  ON venue_service_slots (service_id, starts_at)
  WHERE status = 'scheduled';

CREATE TABLE venue_service_bookings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id      UUID NOT NULL REFERENCES venue_service_slots(id) ON DELETE CASCADE,
  service_id   UUID NOT NULL REFERENCES venue_services(id) ON DELETE CASCADE,
  venue_id     UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_spent INTEGER NOT NULL DEFAULT 0 CHECK (tokens_spent >= 0),
  status       venue_service_booking_status NOT NULL DEFAULT 'confirmed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_venue_service_booking_user_slot_confirmed
  ON venue_service_bookings (user_id, slot_id)
  WHERE status = 'confirmed';

CREATE INDEX idx_venue_service_bookings_slot ON venue_service_bookings (slot_id);
CREATE INDEX idx_venue_service_bookings_venue ON venue_service_bookings (venue_id);
CREATE INDEX idx_venue_service_bookings_user ON venue_service_bookings (user_id);

CREATE TRIGGER trigger_venue_services_updated_at
  BEFORE UPDATE ON venue_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Atomically book a slot: active check-in, capacity, balance, tokens
CREATE OR REPLACE FUNCTION book_venue_service_slot(p_slot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := now();
  v_slot RECORD;
  v_service RECORD;
  v_venue_id UUID;
  v_price INTEGER;
  v_capacity INTEGER;
  v_booked INTEGER;
  v_booking_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT s.id, s.service_id, s.starts_at, s.ends_at, s.status
  INTO v_slot
  FROM venue_service_slots s
  WHERE s.id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot_not_found';
  END IF;

  IF v_slot.status <> 'scheduled' THEN
    RAISE EXCEPTION 'slot_not_available';
  END IF;

  IF v_slot.ends_at <= v_now THEN
    RAISE EXCEPTION 'slot_ended';
  END IF;

  SELECT
    svc.id,
    svc.venue_id,
    svc.price_tokens,
    svc.capacity_per_slot,
    svc.is_active
  INTO v_service
  FROM venue_services svc
  WHERE svc.id = v_slot.service_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_service.is_active THEN
    RAISE EXCEPTION 'service_not_available';
  END IF;

  v_venue_id := v_service.venue_id;
  v_price := v_service.price_tokens;
  v_capacity := v_service.capacity_per_slot;

  IF NOT EXISTS (
    SELECT 1 FROM checkins c
    WHERE c.user_id = v_user_id
      AND c.venue_id = v_venue_id
      AND c.status = 'active'
      AND c.expires_at > v_now
  ) THEN
    RAISE EXCEPTION 'checkin_required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM venue_service_bookings b
    WHERE b.slot_id = p_slot_id
      AND b.user_id = v_user_id
      AND b.status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'already_booked';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_booked
  FROM venue_service_bookings b
  WHERE b.slot_id = p_slot_id
    AND b.status = 'confirmed';

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'slot_full';
  END IF;

  IF v_price > 0 THEN
    UPDATE profiles
    SET token_balance = token_balance - v_price
    WHERE id = v_user_id
      AND token_balance >= v_price;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_tokens';
    END IF;
  END IF;

  INSERT INTO venue_service_bookings (slot_id, service_id, venue_id, user_id, tokens_spent, status)
  VALUES (p_slot_id, v_service.id, v_venue_id, v_user_id, v_price, 'confirmed')
  RETURNING id INTO v_booking_id;

  IF v_price > 0 THEN
    INSERT INTO token_transactions (user_id, venue_id, amount, type, description, reference_id)
    VALUES (
      v_user_id,
      v_venue_id,
      -v_price,
      'service_booking',
      'Service booking',
      v_booking_id
    );
  END IF;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'tokens_spent', v_price
  );
END;
$$;

REVOKE ALL ON FUNCTION book_venue_service_slot(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION book_venue_service_slot(UUID) TO authenticated;

ALTER TABLE venue_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_service_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY venue_services_select ON venue_services FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.is_active = true)
  );

CREATE POLICY venue_services_insert ON venue_services FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators WHERE venue_id = venue_services.venue_id AND user_id = auth.uid())
  );

CREATE POLICY venue_services_update ON venue_services FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators WHERE venue_id = venue_services.venue_id AND user_id = auth.uid())
  );

CREATE POLICY venue_services_delete ON venue_services FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators WHERE venue_id = venue_services.venue_id AND user_id = auth.uid())
  );

-- Staff see all services for their venues (including inactive)
CREATE POLICY venue_services_select_staff ON venue_services FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators WHERE venue_id = venue_services.venue_id AND user_id = auth.uid())
  );

CREATE POLICY venue_service_slots_select ON venue_service_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venue_services s
      JOIN venues v ON v.id = s.venue_id
      WHERE s.id = service_id
        AND s.is_active
        AND v.is_active
        AND status = 'scheduled'
    )
    OR EXISTS (
      SELECT 1 FROM venue_services s
      WHERE s.id = service_id
        AND (
          EXISTS (SELECT 1 FROM venues v WHERE v.id = s.venue_id AND v.owner_id = auth.uid())
          OR EXISTS (SELECT 1 FROM venue_moderators m WHERE m.venue_id = s.venue_id AND m.user_id = auth.uid())
        )
    )
  );

CREATE POLICY venue_service_slots_insert ON venue_service_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_services s
      WHERE s.id = service_id
        AND (
          EXISTS (SELECT 1 FROM venues v WHERE v.id = s.venue_id AND v.owner_id = auth.uid())
          OR EXISTS (SELECT 1 FROM venue_moderators m WHERE m.venue_id = s.venue_id AND m.user_id = auth.uid())
        )
    )
  );

CREATE POLICY venue_service_slots_update ON venue_service_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_services s
      WHERE s.id = service_id
        AND (
          EXISTS (SELECT 1 FROM venues v WHERE v.id = s.venue_id AND v.owner_id = auth.uid())
          OR EXISTS (SELECT 1 FROM venue_moderators m WHERE m.venue_id = s.venue_id AND m.user_id = auth.uid())
        )
    )
  );

CREATE POLICY venue_service_slots_delete ON venue_service_slots FOR DELETE
  USING (
    NOT EXISTS (SELECT 1 FROM venue_service_bookings b WHERE b.slot_id = venue_service_slots.id AND b.status = 'confirmed')
    AND EXISTS (
      SELECT 1 FROM venue_services s
      WHERE s.id = service_id
        AND (
          EXISTS (SELECT 1 FROM venues v WHERE v.id = s.venue_id AND v.owner_id = auth.uid())
          OR EXISTS (SELECT 1 FROM venue_moderators m WHERE m.venue_id = s.venue_id AND m.user_id = auth.uid())
        )
    )
  );

CREATE POLICY venue_service_bookings_select_own ON venue_service_bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY venue_service_bookings_select_staff ON venue_service_bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators m WHERE m.venue_id = venue_service_bookings.venue_id AND m.user_id = auth.uid())
  );

-- No direct INSERT/UPDATE/DELETE for clients; use book_venue_service_slot RPC
