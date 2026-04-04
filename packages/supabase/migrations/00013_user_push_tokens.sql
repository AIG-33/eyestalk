-- Expo push tokens per user (multiple devices allowed)
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'unknown')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

CREATE INDEX idx_user_push_tokens_user ON user_push_tokens (user_id);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_push_tokens_select_own ON user_push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_push_tokens_insert_own ON user_push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_push_tokens_update_own ON user_push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_push_tokens_delete_own ON user_push_tokens FOR DELETE
  USING (auth.uid() = user_id);
