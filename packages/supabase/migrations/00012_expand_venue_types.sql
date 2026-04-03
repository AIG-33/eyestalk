-- Expand venue_type enum with high-traffic venue categories
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'cafe';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'bar';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'gym';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'coworking';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'beauty_salon';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'hotel';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'lounge';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'event_space';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'food_court';
