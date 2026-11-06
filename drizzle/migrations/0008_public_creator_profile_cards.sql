CREATE VIEW public.public_creator_profiles
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
FROM public.profiles;

GRANT SELECT ON public.public_creator_profiles TO anon, authenticated;
GRANT ALL ON public.public_creator_profiles TO service_role;

COMMENT ON VIEW public.public_creator_profiles IS 'Public creator card fields only; deliberately excludes account roles, birth date, age flags and other private profile settings.';
