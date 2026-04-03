-- Add extra profile fields: industry, hobbies, favorites, social links, about
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hobbies VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_movie VARCHAR(150);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_band VARCHAR(150);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_me VARCHAR(500);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin VARCHAR(200);
