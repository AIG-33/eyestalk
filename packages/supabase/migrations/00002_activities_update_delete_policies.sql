-- Allow venue owners and moderators to update activities they manage
CREATE POLICY activities_update ON activities FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators WHERE venue_id = activities.venue_id AND user_id = auth.uid())
  );

-- Allow venue owners and moderators to delete activities they manage
CREATE POLICY activities_delete ON activities FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM venue_moderators WHERE venue_id = activities.venue_id AND user_id = auth.uid())
  );
