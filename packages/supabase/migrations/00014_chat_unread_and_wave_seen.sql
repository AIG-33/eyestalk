-- Per-user read cursor for chat list badges
ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

UPDATE chat_participants
SET last_read_at = COALESCE(last_read_at, joined_at, now())
WHERE last_read_at IS NULL;

ALTER TABLE chat_participants
  ALTER COLUMN last_read_at SET DEFAULT now();

-- Incoming wave seen state (recipient clears tab badge)
ALTER TABLE mutual_interests
  ADD COLUMN IF NOT EXISTS recipient_seen_at TIMESTAMPTZ;

CREATE POLICY chat_participants_update_own ON chat_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY mutual_interests_update_recipient ON mutual_interests FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.my_unread_message_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.messages m
  INNER JOIN public.chat_participants cp
    ON cp.chat_id = m.chat_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  WHERE m.is_deleted = false
    AND m.sender_id <> auth.uid()
    AND m.created_at > COALESCE(cp.last_read_at, cp.joined_at);
$$;

GRANT EXECUTE ON FUNCTION public.my_unread_message_count() TO authenticated;
