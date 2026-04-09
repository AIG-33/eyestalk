-- Allow venue owners to read reports filed at their venues
CREATE POLICY reports_select_venue_owner ON reports
  FOR SELECT
  USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );

-- Allow venue owners to update report status (resolve/dismiss)
CREATE POLICY reports_update_venue_owner ON reports
  FOR UPDATE
  USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );
