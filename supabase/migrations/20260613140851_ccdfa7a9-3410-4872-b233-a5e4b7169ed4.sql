
CREATE OR REPLACE FUNCTION public.guard_profile_verified_seller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified_seller IS DISTINCT FROM OLD.is_verified_seller THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_verified_seller := OLD.is_verified_seller;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_verified_seller ON public.profiles;
CREATE TRIGGER profiles_guard_verified_seller
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verified_seller();
