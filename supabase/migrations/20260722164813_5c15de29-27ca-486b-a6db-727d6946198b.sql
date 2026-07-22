CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO service_role;

CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.review_notes IS DISTINCT FROM OLD.review_notes
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Protected product moderation fields can only be changed by admins'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_product_protected_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_product_protected_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_product_protected_fields() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.guard_product_protected_fields() TO service_role;

DROP TRIGGER IF EXISTS guard_product_protected_fields_trg ON public.products;
CREATE TRIGGER guard_product_protected_fields_trg
BEFORE UPDATE OF seller_id, status, review_notes, reviewed_by, reviewed_at ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.guard_product_protected_fields();

CREATE OR REPLACE FUNCTION public.guard_profile_verified_seller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified_seller IS DISTINCT FROM OLD.is_verified_seller THEN
    IF NOT public.is_current_user_admin() THEN
      NEW.is_verified_seller := OLD.is_verified_seller;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_verified_seller() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_profile_verified_seller() FROM anon;
REVOKE ALL ON FUNCTION public.guard_profile_verified_seller() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.guard_profile_verified_seller() TO service_role;

CREATE OR REPLACE FUNCTION public.guard_profile_is_banned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    IF NOT public.is_current_user_admin() THEN
      NEW.is_banned := OLD.is_banned;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_is_banned() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_profile_is_banned() FROM anon;
REVOKE ALL ON FUNCTION public.guard_profile_is_banned() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.guard_profile_is_banned() TO service_role;

DROP POLICY IF EXISTS "Admins can update any product" ON public.products;
CREATE POLICY "Admins can update any product"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS reports_select_own_or_admin ON public.reports;
CREATE POLICY reports_select_own_or_admin
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS reports_update_admin ON public.reports;
CREATE POLICY reports_update_admin
ON public.reports
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS user_roles_update_admin ON public.user_roles;
CREATE POLICY user_roles_update_admin
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS user_roles_delete_admin ON public.user_roles;
CREATE POLICY user_roles_delete_admin
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;