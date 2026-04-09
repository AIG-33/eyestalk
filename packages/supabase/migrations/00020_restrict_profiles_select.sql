-- Restrict profiles SELECT to only public-safe columns via a view.
-- The RLS policy remains SELECT USING (true) for authenticated users,
-- but sensitive fields (token_balance, is_banned) should not be exposed
-- to arbitrary authenticated clients. 
--
-- We create a restricted view and grant access on it.
-- App code that needs token_balance or is_banned should use service role.

CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT
    id,
    nickname,
    avatar_url,
    bio,
    created_at,
    age,
    gender,
    instagram,
    telegram,
    tiktok
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
