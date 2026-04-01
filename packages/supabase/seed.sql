-- EyesTalk Seed Data for Development
-- Run AFTER a real user has been created via Supabase Auth.
--
-- USAGE:
-- 1. Register a user in EyesTalk (sign up via the app or Supabase Dashboard)
-- 2. Copy their UUID from Supabase Dashboard → Authentication → Users
-- 3. Replace 'YOUR_USER_UUID_HERE' below with the actual UUID
-- 4. Run this SQL in Supabase Dashboard → SQL Editor

-- =============================================
-- Set your test user UUID here:
-- =============================================
DO $$
DECLARE
  test_owner_id uuid := 'YOUR_USER_UUID_HERE'::uuid;  -- <-- REPLACE THIS
BEGIN

-- Create profile if it doesn't exist
INSERT INTO profiles (id, nickname, age_range, interests)
VALUES (test_owner_id, 'Venue Owner', '25-30', ARRAY['nightlife', 'music'])
ON CONFLICT (id) DO NOTHING;

-- Sample venues (Moscow area)
INSERT INTO venues (id, owner_id, name, type, description, address, latitude, longitude, geofence_radius, subscription_tier) VALUES
  ('a0000000-0000-0000-0000-000000000001', test_owner_id, 'Neon Karaoke Bar', 'karaoke', 'Best karaoke experience in town', 'Tverskaya St, 10, Moscow', 55.7639, 37.6089, 50, 'premium'),
  ('a0000000-0000-0000-0000-000000000002', test_owner_id, 'Pulse Nightclub', 'nightclub', 'Electronic music and vibes', 'Arbat St, 25, Moscow', 55.7522, 37.5920, 80, 'premium'),
  ('a0000000-0000-0000-0000-000000000003', test_owner_id, 'Strike Bowling', 'bowling', 'Family-friendly bowling center', 'Kutuzovsky Prospekt, 57, Moscow', 55.7365, 37.5151, 60, 'basic'),
  ('a0000000-0000-0000-0000-000000000004', test_owner_id, 'Cloud 9 Hookah Lounge', 'hookah', 'Premium hookah and chill atmosphere', 'Pokrovka St, 17, Moscow', 55.7598, 37.6463, 40, 'free'),
  ('a0000000-0000-0000-0000-000000000005', test_owner_id, 'Game On Bar', 'board_games', 'Board games, drinks, and fun', 'Maroseyka St, 9, Moscow', 55.7569, 37.6383, 35, 'basic')
ON CONFLICT DO NOTHING;

-- Venue zones
INSERT INTO venue_zones (venue_id, name, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Main Stage', 1),
  ('a0000000-0000-0000-0000-000000000001', 'VIP Room', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Bar', 3),
  ('a0000000-0000-0000-0000-000000000002', 'Dance Floor', 1),
  ('a0000000-0000-0000-0000-000000000002', 'VIP', 2),
  ('a0000000-0000-0000-0000-000000000002', 'Bar', 3),
  ('a0000000-0000-0000-0000-000000000002', 'Terrace', 4),
  ('a0000000-0000-0000-0000-000000000003', 'Lanes 1-5', 1),
  ('a0000000-0000-0000-0000-000000000003', 'Lanes 6-10', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Bar Area', 3)
ON CONFLICT DO NOTHING;

-- QR codes for check-in
INSERT INTO qr_codes (venue_id, code, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'NEON-KARAOKE-2026', 'permanent'),
  ('a0000000-0000-0000-0000-000000000002', 'PULSE-CLUB-2026', 'permanent'),
  ('a0000000-0000-0000-0000-000000000003', 'STRIKE-BOWL-2026', 'permanent'),
  ('a0000000-0000-0000-0000-000000000004', 'CLOUD9-HOOKAH-2026', 'permanent'),
  ('a0000000-0000-0000-0000-000000000005', 'GAMEON-BAR-2026', 'permanent')
ON CONFLICT DO NOTHING;

END $$;
