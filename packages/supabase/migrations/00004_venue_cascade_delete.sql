-- Add ON DELETE CASCADE to all venue FK references that are missing it,
-- and add DELETE RLS policy for venue owners.

-- checkins: venue_id -> venues(id)
ALTER TABLE checkins DROP CONSTRAINT checkins_venue_id_fkey;
ALTER TABLE checkins ADD CONSTRAINT checkins_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- chats: venue_id -> venues(id)
ALTER TABLE chats DROP CONSTRAINT chats_venue_id_fkey;
ALTER TABLE chats ADD CONSTRAINT chats_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- mutual_interests: venue_id -> venues(id)
ALTER TABLE mutual_interests DROP CONSTRAINT mutual_interests_venue_id_fkey;
ALTER TABLE mutual_interests ADD CONSTRAINT mutual_interests_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- activities: venue_id -> venues(id)
ALTER TABLE activities DROP CONSTRAINT activities_venue_id_fkey;
ALTER TABLE activities ADD CONSTRAINT activities_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- token_transactions: venue_id -> venues(id) (nullable)
ALTER TABLE token_transactions DROP CONSTRAINT token_transactions_venue_id_fkey;
ALTER TABLE token_transactions ADD CONSTRAINT token_transactions_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;

-- reports: venue_id -> venues(id)
ALTER TABLE reports DROP CONSTRAINT reports_venue_id_fkey;
ALTER TABLE reports ADD CONSTRAINT reports_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- leaderboards: venue_id -> venues(id)
ALTER TABLE leaderboards DROP CONSTRAINT leaderboards_venue_id_fkey;
ALTER TABLE leaderboards ADD CONSTRAINT leaderboards_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- RLS: allow venue owners to delete their venues
CREATE POLICY venues_delete ON venues FOR DELETE
  USING (auth.uid() = owner_id);
