-- Allow booking venue services without an active check-in.
-- Replaces book_venue_service_slot to drop the checkin_required guard.

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
