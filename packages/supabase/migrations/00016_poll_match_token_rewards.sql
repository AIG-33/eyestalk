-- Poll vote and mutual match token reward types
ALTER TYPE token_transaction_type ADD VALUE IF NOT EXISTS 'poll_participation_reward';
ALTER TYPE token_transaction_type ADD VALUE IF NOT EXISTS 'match_reward';

-- One vote per user per poll (prevents duplicate votes and duplicate rewards)
-- Remove legacy duplicates before unique index (keep earliest vote per pair).
DELETE FROM votes v
WHERE v.id NOT IN (
  SELECT DISTINCT ON (activity_id, user_id) id
  FROM votes
  ORDER BY activity_id, user_id, created_at ASC NULLS LAST, id ASC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_activity_user ON votes (activity_id, user_id);

-- Optional reference_id on token rows (e.g. activity id, mutual_interest id)
CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_type token_transaction_type,
  p_venue_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_reference_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET token_balance = token_balance + p_amount WHERE id = p_user_id;

  INSERT INTO token_transactions (user_id, venue_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_venue_id, p_amount, p_type, p_description, p_reference_id);
END;
$$ LANGUAGE plpgsql;
