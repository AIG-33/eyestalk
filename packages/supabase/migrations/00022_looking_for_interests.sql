-- "Find your kind of crowd" — interest-based people matching.
--
-- Adds a second interest set to profiles: `looking_for_interests` — the
-- interests a user hopes to find in the people they meet. The map can then
-- highlight venues where currently checked-in (and visible) people have
-- interests that overlap with what the viewer is looking for.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS looking_for_interests TEXT[] DEFAULT '{}';

-- Expose looking_for_interests on the public-safe view (recreated to keep the
-- column list in sync with the live schema, mirroring 00021).
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT
    id,
    nickname,
    avatar_url,
    bio,
    age_range,
    interests,
    looking_for_interests,
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

-- Per-venue count of active + visible check-ins whose owner shares at least
-- one interest with `p_interests`. SECURITY DEFINER so the aggregate is
-- computed server-side without leaking individual identities and without
-- tripping over per-row RLS. Returns only (venue_id, match_count).
CREATE OR REPLACE FUNCTION public.venue_interest_match_counts(p_interests TEXT[])
RETURNS TABLE (venue_id UUID, match_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.venue_id, COUNT(DISTINCT c.user_id) AS match_count
  FROM public.checkins c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.status = 'active'
    AND c.is_visible = true
    AND p.deleted_at IS NULL
    AND p.interests && p_interests          -- array overlap: ≥1 shared interest
  GROUP BY c.venue_id;
$$;

REVOKE ALL ON FUNCTION public.venue_interest_match_counts(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.venue_interest_match_counts(TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.venue_interest_match_counts(TEXT[]) IS
  'Returns, per venue, the number of active+visible checked-in users whose interests overlap the given set. Used by the map "matches" mode.';
