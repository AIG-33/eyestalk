-- Per-user subscriptions to venue services for slot availability notifications

CREATE TABLE venue_service_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES venue_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT venue_service_subscriptions_unique UNIQUE (user_id, service_id)
);

CREATE INDEX idx_venue_service_subs_service ON venue_service_subscriptions (service_id);
CREATE INDEX idx_venue_service_subs_user    ON venue_service_subscriptions (user_id);

ALTER TABLE venue_service_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY venue_service_subs_select_own ON venue_service_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY venue_service_subs_insert_own ON venue_service_subscriptions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM venue_services s
      JOIN venues v ON v.id = s.venue_id
      WHERE s.id = service_id AND s.is_active AND v.is_active
    )
  );

CREATE POLICY venue_service_subs_delete_own ON venue_service_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Staff can see subscribers for their services (for analytics)
CREATE POLICY venue_service_subs_select_staff ON venue_service_subscriptions FOR SELECT
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
