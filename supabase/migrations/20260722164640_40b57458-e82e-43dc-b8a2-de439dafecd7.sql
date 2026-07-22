CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
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

DROP TRIGGER IF EXISTS guard_product_protected_fields_trg ON public.products;
CREATE TRIGGER guard_product_protected_fields_trg
BEFORE UPDATE OF seller_id, status, review_notes, reviewed_by, reviewed_at ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.guard_product_protected_fields();

DROP POLICY IF EXISTS products_update_own ON public.products;
CREATE POLICY products_update_own
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);