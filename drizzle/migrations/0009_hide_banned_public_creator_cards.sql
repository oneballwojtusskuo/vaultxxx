CREATE OR REPLACE VIEW public.public_creator_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  bio,
  is_verified_seller,
  created_at
FROM public.profiles
WHERE is_banned = false;

COMMENT ON VIEW public.public_creator_profiles IS 'Public creator card fields only for non-banned accounts; excludes account roles, birth date, age flags and other private profile settings.';
