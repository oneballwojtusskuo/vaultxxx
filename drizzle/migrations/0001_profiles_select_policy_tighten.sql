DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_visible ON public.profiles FOR SELECT TO anon, authenticated
USING (auth.uid() = id OR coalesce(is_banned, false) = false OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, avatar_url, bio, is_verified_seller, is_banned, onboarding_completed, created_at, updated_at) ON public.profiles TO anon, authenticated;