-- ============================================================
-- GAMIFICATION: Achievements, User Achievements, Venue Loyalty
-- ANNOUNCEMENTS: Add 'announcement' to message_type enum
-- ============================================================

-- Add 'announcement' to message_type enum
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'announcement';

-- Add 'achievement_reward' to token_transaction_type enum
ALTER TYPE token_transaction_type ADD VALUE IF NOT EXISTS 'achievement_reward';

-- Achievement categories
CREATE TYPE achievement_category AS ENUM (
  'social', 'explorer', 'loyalty', 'activity'
);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

CREATE TABLE achievements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT UNIQUE NOT NULL,
  category   achievement_category NOT NULL,
  icon       TEXT NOT NULL DEFAULT '🏆',
  threshold  INTEGER NOT NULL DEFAULT 1,
  token_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress       INTEGER NOT NULL DEFAULT 0,
  unlocked_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements (user_id) WHERE unlocked_at IS NOT NULL;

-- ============================================================
-- VENUE LOYALTY
-- ============================================================

CREATE TABLE venue_loyalty_tiers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id       UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name           VARCHAR(50) NOT NULL,
  min_checkins   INTEGER NOT NULL DEFAULT 1,
  token_reward   INTEGER NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id, name)
);

CREATE INDEX idx_venue_loyalty_venue ON venue_loyalty_tiers (venue_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY achievements_select ON achievements FOR SELECT USING (true);

CREATE POLICY user_achievements_select_own ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_achievements_insert ON user_achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_achievements_update ON user_achievements
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY venue_loyalty_select ON venue_loyalty_tiers
  FOR SELECT USING (true);

CREATE POLICY venue_loyalty_insert ON venue_loyalty_tiers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
  );

CREATE POLICY venue_loyalty_update ON venue_loyalty_tiers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
  );

CREATE POLICY venue_loyalty_delete ON venue_loyalty_tiers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
  );

-- ============================================================
-- REALTIME for user_achievements
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;

-- ============================================================
-- SEED: Achievement definitions
-- ============================================================

INSERT INTO achievements (slug, category, icon, threshold, token_reward, sort_order) VALUES
  -- Explorer achievements
  ('first_checkin',     'explorer', '👋', 1,   5,  1),
  ('venues_5',          'explorer', '🗺️', 5,   20, 2),
  ('venues_10',         'explorer', '🌍', 10,  50, 3),
  ('venues_25',         'explorer', '🧭', 25,  100, 4),
  ('venues_50',         'explorer', '🏅', 50,  200, 5),
  -- Loyalty achievements
  ('regular_5',         'loyalty',  '⭐', 5,   20, 10),
  ('regular_10',        'loyalty',  '🌟', 10,  50, 11),
  ('regular_25',        'loyalty',  '💎', 25,  100, 12),
  ('streak_3',          'loyalty',  '🔥', 3,   15, 13),
  ('streak_7',          'loyalty',  '🔥', 7,   50, 14),
  -- Social achievements
  ('first_wave',        'social',   '👋', 1,   5,  20),
  ('matches_5',         'social',   '🤝', 5,   20, 21),
  ('matches_10',        'social',   '💫', 10,  50, 22),
  ('messages_50',       'social',   '💬', 50,  20, 23),
  ('messages_200',      'social',   '📖', 200, 50, 24),
  -- Activity achievements
  ('first_activity',    'activity', '🎯', 1,   5,  30),
  ('activities_10',     'activity', '🏆', 10,  50, 31),
  ('first_poll_vote',   'activity', '🗳️', 1,   5,  32);
