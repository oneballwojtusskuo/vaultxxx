ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_accepted boolean NOT NULL DEFAULT false;
GRANT SELECT (age_verified, parental_consent_accepted) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_signup_age_flags()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE meta jsonb;
BEGIN
  SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = NEW.id;
  IF meta IS NOT NULL AND (meta->>'age_consent_accepted') = 'true' THEN
    NEW.age_verified := true;
    NEW.parental_consent_accepted := true;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.apply_signup_age_flags() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS apply_signup_age_flags_trg ON public.profiles;
CREATE TRIGGER apply_signup_age_flags_trg BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.apply_signup_age_flags();

DROP POLICY IF EXISTS follows_select_all ON public.follows;
CREATE POLICY follows_select_own ON public.follows FOR SELECT TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE OR REPLACE FUNCTION public.follow_counts(_user_id uuid)
RETURNS TABLE(followers bigint, following bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*) FROM public.follows WHERE following_id = _user_id),
         (SELECT count(*) FROM public.follows WHERE follower_id = _user_id)
$$;
GRANT EXECUTE ON FUNCTION public.follow_counts(uuid) TO anon, authenticated;