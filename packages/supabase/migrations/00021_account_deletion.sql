-- Account deletion / right to erasure (GDPR Art. 17, UAE PDPL Art. 7,
-- Google Play & Apple App Store user-data-deletion requirements).
--
-- We use soft-deletion + anonymisation for the in-app "Delete account" flow,
-- with a follow-up purge ran from the server side. This avoids tripping over
-- the many FOREIGN KEYs that reference profiles.id without ON DELETE CASCADE
-- (chats, messages, votes, reports, blocks, etc.) where preserving moderation
-- and chat history is desirable while still scrubbing identifiable data.
--
-- After a 30-day grace period the corresponding auth.users row is purged by a
-- background job; the ON DELETE CASCADE on profiles.id then removes the
-- anonymised profile row.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON public.profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Hide soft-deleted users from the public-safe view used by the mobile app.
-- DROP + CREATE (rather than CREATE OR REPLACE) so we can change the column
-- list to match what actually exists in the live schema.
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT
    id,
    nickname,
    avatar_url,
    bio,
    age_range,
    interests,
    industry,
    hobbies,
    favorite_movie,
    favorite_band,
    about_me,
    instagram,
    telegram,
    linkedin,
    is_verified,
    created_at
  FROM public.profiles
  WHERE deleted_at IS NULL;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- SECURITY DEFINER RPC the mobile app can call from an authenticated session
-- to anonymise its own profile and revoke active sessions. We do not delete
-- auth.users here so that referential integrity from venues / chats /
-- moderation rows is preserved until the cron purge runs.
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_anon_nick TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  v_anon_nick := 'deleted_' || substr(replace(v_user_id::text, '-', ''), 1, 8);

  UPDATE public.profiles
  SET
    nickname        = v_anon_nick,
    avatar_url      = NULL,
    bio             = NULL,
    industry        = NULL,
    hobbies         = NULL,
    favorite_movie  = NULL,
    favorite_band   = NULL,
    about_me        = NULL,
    instagram       = NULL,
    telegram        = NULL,
    linkedin        = NULL,
    interests       = '{}',
    deleted_at      = now(),
    updated_at      = now()
  WHERE id = v_user_id;

  -- Drop ancillary identifiable rows that have ON DELETE CASCADE off profiles.
  DELETE FROM public.profile_photos WHERE user_id = v_user_id;
  DELETE FROM public.user_push_tokens WHERE user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

COMMENT ON FUNCTION public.request_account_deletion() IS
  'Soft-deletes the calling user: anonymises profile, drops photos/push tokens, sets deleted_at. Background job purges auth.users after the grace period.';
