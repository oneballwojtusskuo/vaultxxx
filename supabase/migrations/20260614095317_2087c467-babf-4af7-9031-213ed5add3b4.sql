
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_profile_is_banned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_banned := OLD.is_banned;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_profile_is_banned_trg ON public.profiles;
CREATE TRIGGER guard_profile_is_banned_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_is_banned();

REVOKE EXECUTE ON FUNCTION public.guard_profile_is_banned() FROM public, anon, authenticated;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes text;

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
