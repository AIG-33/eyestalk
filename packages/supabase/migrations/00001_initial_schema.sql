-- EyesTalk — Initial Database Schema
-- Based on Technical Specification v1.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE venue_type AS ENUM (
  'karaoke', 'nightclub', 'sports_bar', 'bowling', 'billiards',
  'hookah', 'board_games', 'arcade', 'standup', 'live_music', 'other'
);

CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');

CREATE TYPE checkin_method AS ENUM ('qr', 'geofence', 'code');

CREATE TYPE checkin_status AS ENUM ('active', 'expired', 'manual_checkout');

CREATE TYPE chat_type AS ENUM ('venue_general', 'zone', 'direct', 'group');

CREATE TYPE message_type AS ENUM (
  'text', 'emoji', 'sticker', 'image', 'wave', 'compliment', 'system'
);

CREATE TYPE interest_action_type AS ENUM ('wave', 'like', 'compliment');

CREATE TYPE activity_type AS ENUM (
  'poll', 'contest', 'tournament', 'challenge', 'quest', 'auction'
);

CREATE TYPE activity_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

CREATE TYPE token_transaction_type AS ENUM (
  'checkin_reward', 'activity_reward', 'activity_cost', 'vote_cost',
  'boost', 'referral', 'venue_bonus', 'purchase'
);

CREATE TYPE report_reason AS ENUM (
  'spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'
);

CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

CREATE TYPE venue_story_type AS ENUM ('moment', 'announcement', 'promo');

CREATE TYPE qr_code_type AS ENUM ('permanent', 'rotating', 'one_time');

CREATE TYPE leaderboard_type AS ENUM ('daily', 'weekly', 'event', 'activity');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    VARCHAR(30) NOT NULL,
  age_range   VARCHAR(10) NOT NULL,
  avatar_url  VARCHAR(500),
  interests   TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_banned   BOOLEAN DEFAULT false,
  token_balance INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Venues
CREATE TABLE venues (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES profiles(id),
  name              VARCHAR(100) NOT NULL,
  type              venue_type NOT NULL,
  description       TEXT,
  address           VARCHAR(300) NOT NULL,
  latitude          DECIMAL(10,8) NOT NULL,
  longitude         DECIMAL(11,8) NOT NULL,
  geofence_radius   INTEGER DEFAULT 50,
  wifi_ssid         VARCHAR(100),
  logo_url          VARCHAR(500),
  cover_url         VARCHAR(500),
  subscription_tier subscription_tier DEFAULT 'free',
  is_active         BOOLEAN DEFAULT true,
  settings          JSONB DEFAULT '{}',
  location          GEOGRAPHY(Point, 4326),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Venue Zones
CREATE TABLE venue_zones (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true
);

-- Check-ins
CREATE TABLE checkins (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  venue_id       UUID NOT NULL REFERENCES venues(id),
  zone_id        UUID REFERENCES venue_zones(id),
  method         checkin_method NOT NULL,
  status         checkin_status DEFAULT 'active',
  status_tag     VARCHAR(50),
  is_visible     BOOLEAN DEFAULT false,
  tokens_earned  INTEGER DEFAULT 0,
  checked_in_at  TIMESTAMPTZ DEFAULT now(),
  checked_out_at TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ NOT NULL
);

-- Chats
CREATE TABLE chats (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID NOT NULL REFERENCES venues(id),
  zone_id    UUID REFERENCES venue_zones(id),
  type       chat_type NOT NULL,
  name       VARCHAR(100),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Chat Participants
CREATE TABLE chat_participants (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id   UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at   TIMESTAMPTZ,
  UNIQUE(chat_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id      UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES profiles(id),
  content      TEXT NOT NULL,
  type         message_type DEFAULT 'text',
  media_url    VARCHAR(500),
  is_moderated BOOLEAN DEFAULT false,
  is_deleted   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Mutual Interests
CREATE TABLE mutual_interests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id     UUID NOT NULL REFERENCES venues(id),
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id   UUID NOT NULL REFERENCES profiles(id),
  type         interest_action_type NOT NULL,
  message      VARCHAR(200),
  is_mutual    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id, from_user_id, to_user_id)
);

-- Activities
CREATE TABLE activities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id         UUID NOT NULL REFERENCES venues(id),
  zone_id          UUID REFERENCES venue_zones(id),
  created_by       UUID NOT NULL REFERENCES profiles(id),
  type             activity_type NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  config           JSONB DEFAULT '{}',
  status           activity_status DEFAULT 'draft',
  max_participants INTEGER,
  token_cost       INTEGER DEFAULT 0,
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Activity Participants
CREATE TABLE activity_participants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  score       INTEGER DEFAULT 0,
  rank        INTEGER,
  data        JSONB,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Votes
CREATE TABLE votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id  UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id),
  option_key   VARCHAR(100) NOT NULL,
  tokens_spent INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Token Transactions
CREATE TABLE token_transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  venue_id     UUID REFERENCES venues(id),
  amount       INTEGER NOT NULL,
  type         token_transaction_type NOT NULL,
  reference_id UUID,
  description  VARCHAR(200) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Reports
CREATE TABLE reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id         UUID NOT NULL REFERENCES profiles(id),
  reported_user_id    UUID REFERENCES profiles(id),
  reported_message_id UUID REFERENCES messages(id),
  venue_id            UUID NOT NULL REFERENCES venues(id),
  reason              report_reason NOT NULL,
  description         TEXT,
  status              report_status DEFAULT 'pending',
  resolved_by         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Blocks
CREATE TABLE blocks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id),
  blocked_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Venue Stories
CREATE TABLE venue_stories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  content    TEXT NOT NULL,
  media_url  VARCHAR(500),
  type       venue_story_type NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Venue Moderators
CREATE TABLE venue_moderators (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id    UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  permissions JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id, user_id)
);

-- Leaderboards
CREATE TABLE leaderboards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id    UUID NOT NULL REFERENCES venues(id),
  type        leaderboard_type NOT NULL,
  activity_id UUID REFERENCES activities(id),
  data        JSONB DEFAULT '[]',
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- QR Codes
CREATE TABLE qr_codes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  zone_id    UUID REFERENCES venue_zones(id),
  code       VARCHAR(100) UNIQUE NOT NULL,
  type       qr_code_type NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_venues_location ON venues USING GIST (location);
CREATE INDEX idx_venues_type ON venues (type);
CREATE INDEX idx_venues_owner ON venues (owner_id);
CREATE INDEX idx_venues_active ON venues (is_active) WHERE is_active = true;

CREATE INDEX idx_checkins_user_active ON checkins (user_id, status) WHERE status = 'active';
CREATE INDEX idx_checkins_venue_active ON checkins (venue_id, status) WHERE status = 'active';
CREATE INDEX idx_checkins_expires ON checkins (expires_at) WHERE status = 'active';

CREATE INDEX idx_messages_chat ON messages (chat_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages (sender_id);

CREATE INDEX idx_chat_participants_chat ON chat_participants (chat_id);
CREATE INDEX idx_chat_participants_user ON chat_participants (user_id);

CREATE INDEX idx_mutual_interests_to ON mutual_interests (to_user_id, venue_id);
CREATE INDEX idx_mutual_interests_from ON mutual_interests (from_user_id, venue_id);

CREATE INDEX idx_activities_venue ON activities (venue_id, status);
CREATE INDEX idx_activity_participants_activity ON activity_participants (activity_id);

CREATE INDEX idx_token_transactions_user ON token_transactions (user_id, created_at DESC);

CREATE INDEX idx_reports_venue ON reports (venue_id, status);
CREATE INDEX idx_blocks_blocker ON blocks (blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks (blocked_id);

CREATE INDEX idx_venue_stories_venue ON venue_stories (venue_id, expires_at DESC);
CREATE INDEX idx_qr_codes_venue ON qr_codes (venue_id) WHERE is_active = true;
CREATE INDEX idx_qr_codes_code ON qr_codes (code) WHERE is_active = true;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-populate PostGIS location column from lat/lng
CREATE OR REPLACE FUNCTION set_venue_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_venue_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON venues
  FOR EACH ROW
  EXECUTE FUNCTION set_venue_location();

-- Find nearby venues using PostGIS
CREATE OR REPLACE FUNCTION nearby_venues(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5
)
RETURNS SETOF venues AS $$
BEGIN
  RETURN QUERY
  SELECT v.*
  FROM venues v
  WHERE v.is_active = true
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY v.location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql;

-- Add tokens to a user and create a transaction record
CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_type token_transaction_type,
  p_venue_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT ''
)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET token_balance = token_balance + p_amount WHERE id = p_user_id;

  INSERT INTO token_transactions (user_id, venue_id, amount, type, description)
  VALUES (p_user_id, p_venue_id, p_amount, p_type, p_description);
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update only their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Venues: anyone can read active venues, owners can update
CREATE POLICY venues_select ON venues FOR SELECT USING (is_active = true);
CREATE POLICY venues_insert ON venues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY venues_update ON venues FOR UPDATE USING (auth.uid() = owner_id);

-- Venue Zones: readable by all, writable by venue owner
CREATE POLICY venue_zones_select ON venue_zones FOR SELECT USING (true);
CREATE POLICY venue_zones_insert ON venue_zones FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()));

-- Checkins: user can see own and venue's active checkins
CREATE POLICY checkins_select_own ON checkins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY checkins_select_venue ON checkins FOR SELECT
  USING (status = 'active' AND is_visible = true);
CREATE POLICY checkins_insert ON checkins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY checkins_update ON checkins FOR UPDATE USING (user_id = auth.uid());

-- Messages: participants can read messages in their chats
CREATE POLICY messages_select ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_id = messages.chat_id AND user_id = auth.uid() AND left_at IS NULL
  ));
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Mutual Interests: can see own interests
CREATE POLICY mutual_interests_select ON mutual_interests FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY mutual_interests_insert ON mutual_interests FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Token Transactions: user can see own
CREATE POLICY token_transactions_select ON token_transactions FOR SELECT
  USING (user_id = auth.uid());

-- Blocks: user can manage own blocks
CREATE POLICY blocks_select ON blocks FOR SELECT USING (blocker_id = auth.uid());
CREATE POLICY blocks_insert ON blocks FOR INSERT WITH CHECK (blocker_id = auth.uid());
CREATE POLICY blocks_delete ON blocks FOR DELETE USING (blocker_id = auth.uid());

-- Reports: user can create reports
CREATE POLICY reports_insert ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_select_own ON reports FOR SELECT USING (reporter_id = auth.uid());

-- Activities: anyone in venue can see
CREATE POLICY activities_select ON activities FOR SELECT USING (true);
CREATE POLICY activities_insert ON activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM venue_moderators WHERE venue_id = activities.venue_id AND user_id = auth.uid()
  ));

-- Activity Participants: can see all, insert own
CREATE POLICY activity_participants_select ON activity_participants FOR SELECT USING (true);
CREATE POLICY activity_participants_insert ON activity_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Votes: insert own
CREATE POLICY votes_insert ON votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY votes_select ON votes FOR SELECT USING (true);

-- Venue Stories: anyone can read non-expired
CREATE POLICY venue_stories_select ON venue_stories FOR SELECT
  USING (expires_at > now());

-- Leaderboards: anyone can read
CREATE POLICY leaderboards_select ON leaderboards FOR SELECT USING (true);

-- QR Codes: venue owner can manage
CREATE POLICY qr_codes_select ON qr_codes FOR SELECT USING (true);
CREATE POLICY qr_codes_insert ON qr_codes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()));

-- Chats: participants can see
CREATE POLICY chats_select ON chats FOR SELECT USING (
  type = 'venue_general' OR
  EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = chats.id AND user_id = auth.uid())
);

-- Chat Participants
CREATE POLICY chat_participants_select ON chat_participants FOR SELECT USING (true);
CREATE POLICY chat_participants_insert ON chat_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Venue Moderators: venue owners can manage
CREATE POLICY venue_moderators_select ON venue_moderators FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, age_range)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    '18-24'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE mutual_interests;

-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatar delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- CRON (pg_cron) — auto-checkout expired checkins
-- ============================================================

-- Uncomment if pg_cron extension is enabled in your Supabase project:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'auto-checkout-expired',
--   '*/5 * * * *',
--   $$UPDATE checkins SET status = 'expired', checked_out_at = now() WHERE status = 'active' AND expires_at < now()$$
-- );
--
-- SELECT cron.schedule(
--   'cleanup-expired-chats',
--   '0 * * * *',
--   $$UPDATE chats SET is_active = false WHERE is_active = true AND expires_at < now()$$
-- );
