ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_category text;

-- Allow sellers to hide (archive) and restore their own listings.
CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;

  -- Seller may toggle their own listing between published and archived.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND OLD.seller_id = auth.uid()
     AND NEW.seller_id = OLD.seller_id
     AND OLD.status IN ('published'::product_status, 'archived'::product_status)
     AND NEW.status IN ('published'::product_status, 'archived'::product_status) THEN
    IF NEW.review_notes IS DISTINCT FROM OLD.review_notes
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      RAISE EXCEPTION 'Protected product moderation fields can only be changed by admins'
        USING ERRCODE = '42501';
    END IF;
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
$function$;

-- Buyers must keep access: a product with transactions can only be archived by its seller.
CREATE OR REPLACE FUNCTION public.guard_product_delete_with_sales()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.is_current_user_admin() THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.product_id = OLD.id
      AND t.status IN ('held'::transaction_status,'released'::transaction_status,'completed'::transaction_status,'disputed'::transaction_status)
  ) THEN
    RAISE EXCEPTION 'Product has buyers and cannot be deleted — archive it instead'
      USING ERRCODE = '42501';
  END IF;

  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS guard_product_delete_with_sales_trg ON public.products;
CREATE TRIGGER guard_product_delete_with_sales_trg
BEFORE DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.guard_product_delete_with_sales();

-- Keyword search with weighting: title > tags > custom category > category > description
CREATE OR REPLACE FUNCTION public.search_products(q text DEFAULT NULL, cat text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  price numeric,
  currency text,
  preview_url text,
  is_tradable boolean,
  downloads_count integer,
  custom_category text,
  category_name text,
  category_icon text,
  category_slug text,
  score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.title, p.price, p.currency, p.preview_url, p.is_tradable, p.downloads_count,
    p.custom_category, c.name, c.icon, c.slug,
    COALESCE((
      SELECT SUM(
        CASE WHEN lower(p.title) LIKE '%'||t||'%' THEN 10 ELSE 0 END
      + CASE WHEN EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE lower(tg) LIKE '%'||t||'%') THEN 6 ELSE 0 END
      + CASE WHEN lower(COALESCE(p.custom_category,'')) LIKE '%'||t||'%' THEN 5 ELSE 0 END
      + CASE WHEN lower(COALESCE(c.name,'')) LIKE '%'||t||'%' THEN 4 ELSE 0 END
      + CASE WHEN lower(COALESCE(p.description,'')) LIKE '%'||t||'%' THEN 2 ELSE 0 END
      )
      FROM unnest(string_to_array(lower(btrim(COALESCE(q,''))), ' ')) AS t
      WHERE btrim(t) <> ''
    ), 0)::real AS score
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.status = 'published'::product_status
    AND (cat IS NULL OR c.slug = cat)
    AND (
      btrim(COALESCE(q,'')) = ''
      OR EXISTS (
        SELECT 1
        FROM unnest(string_to_array(lower(btrim(COALESCE(q,''))), ' ')) AS t
        WHERE btrim(t) <> ''
          AND (
            lower(p.title) LIKE '%'||t||'%'
            OR lower(COALESCE(p.description,'')) LIKE '%'||t||'%'
            OR lower(COALESCE(p.custom_category,'')) LIKE '%'||t||'%'
            OR lower(COALESCE(c.name,'')) LIKE '%'||t||'%'
            OR EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE lower(tg) LIKE '%'||t||'%')
          )
      )
    )
  ORDER BY score DESC, p.downloads_count DESC, p.created_at DESC
  LIMIT 200;
$function$;

GRANT EXECUTE ON FUNCTION public.search_products(text, text) TO anon, authenticated, service_role;