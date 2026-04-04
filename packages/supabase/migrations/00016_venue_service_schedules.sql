-- Schedule templates for bulk slot generation + timezone support + date index

-- Timezone for venue (used for schedule time interpretation)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Moscow';

-- Schedule templates (recurring pattern to generate slots)
CREATE TABLE venue_service_schedules (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES venue_services(id) ON DELETE CASCADE,
  -- Inclusive date range (DATE, no time)
  date_from  DATE NOT NULL,
  date_to    DATE NOT NULL,
  -- Days of week: array of 0-6 where 0=Sunday, 1=Monday, ..., 6=Saturday
  weekdays   SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  -- Time of day for the slot start (stored as local wall-clock time)
  slot_time  TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT venue_service_schedules_dates_order CHECK (date_to >= date_from)
);

CREATE INDEX idx_venue_service_schedules_service ON venue_service_schedules (service_id);

ALTER TABLE venue_service_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY venue_service_schedules_select ON venue_service_schedules FOR SELECT
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

CREATE POLICY venue_service_schedules_insert ON venue_service_schedules FOR INSERT
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

CREATE POLICY venue_service_schedules_delete ON venue_service_schedules FOR DELETE
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

-- Fast lookup "which days have slots for this service"
-- Use starts_at directly (range queries >=dayStart and <=dayEnd hit this index fine)
CREATE INDEX idx_venue_service_slots_date
  ON venue_service_slots (service_id, starts_at)
  WHERE status = 'scheduled';

-- RPC: generate slots from a schedule template
-- Returns the count of newly created slots (skips duplicates)
CREATE OR REPLACE FUNCTION generate_service_slots(p_schedule_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sched    RECORD;
  v_service  RECORD;
  v_tz       TEXT;
  v_cur      DATE;
  v_dow      SMALLINT;
  v_start    TIMESTAMPTZ;
  v_end      TIMESTAMPTZ;
  v_count    INTEGER := 0;
  v_rows     INTEGER;
BEGIN
  SELECT
    sch.id,
    sch.service_id,
    sch.date_from,
    sch.date_to,
    sch.weekdays,
    sch.slot_time,
    svc.duration_minutes,
    svc.venue_id
  INTO v_sched
  FROM venue_service_schedules sch
  JOIN venue_services svc ON svc.id = sch.service_id
  WHERE sch.id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'schedule_not_found';
  END IF;

  -- Permission check
  IF NOT EXISTS (
    SELECT 1 FROM venues WHERE id = v_sched.venue_id AND owner_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM venue_moderators WHERE venue_id = v_sched.venue_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Get venue timezone
  SELECT COALESCE(timezone, 'Europe/Moscow') INTO v_tz
  FROM venues WHERE id = v_sched.venue_id;

  v_cur := v_sched.date_from;
  WHILE v_cur <= v_sched.date_to LOOP
    v_dow := EXTRACT(DOW FROM v_cur)::SMALLINT;
    IF v_dow = ANY(v_sched.weekdays) THEN
      -- Build timestamp in venue local time, then convert to UTC
      v_start := (v_cur::TEXT || ' ' || v_sched.slot_time::TEXT)::TIMESTAMP AT TIME ZONE v_tz;
      v_end   := v_start + (v_sched.duration_minutes || ' minutes')::INTERVAL;

      INSERT INTO venue_service_slots (service_id, starts_at, ends_at)
      VALUES (v_sched.service_id, v_start, v_end)
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_count := v_count + v_rows;
    END IF;
    v_cur := v_cur + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION generate_service_slots(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_service_slots(UUID) TO authenticated;
