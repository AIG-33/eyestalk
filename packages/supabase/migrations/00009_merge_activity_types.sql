-- Step 1: Add 'event' to activity_type enum
-- IMPORTANT: must be committed BEFORE step 2 (run separately in SQL Editor)
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'event';

-- Step 2: Run AFTER step 1 is committed
-- UPDATE activities SET type = 'event' WHERE type IN ('contest', 'tournament', 'challenge', 'quest');
