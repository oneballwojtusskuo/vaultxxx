
CREATE OR REPLACE FUNCTION public.search_products(
  q text DEFAULT NULL,
  cat text DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  min_seller_rating numeric DEFAULT NULL,
  free_only boolean DEFAULT false,
  tradable_only boolean DEFAULT false,
  min_downloads integer DEFAULT NULL
)
RETURNS TABLE(
  id uuid, title text, price numeric, currency text, preview_url text,
  is_tradable boolean, downloads_count integer, seller_id uuid,
  custom_category text, category_name text, category_icon text, category_slug text,
  score real
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      p.id, p.title, p.price, p.currency, p.preview_url, p.is_tradable, p.downloads_count,
      p.seller_id, p.custom_category, c.name AS category_name, c.icon AS category_icon,
      c.slug AS category_slug, p.created_at,
      COALESCE((
        SELECT SUM(
          CASE WHEN public.pl_norm(p.title) LIKE '%'||t||'%' THEN 10 ELSE 0 END
        + CASE WHEN EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE public.pl_norm(tg) LIKE '%'||t||'%') THEN 6 ELSE 0 END
        + CASE WHEN public.pl_norm(COALESCE(p.custom_category,'')) LIKE '%'||t||'%' THEN 5 ELSE 0 END
        + CASE WHEN public.pl_norm(COALESCE(c.name,'')) LIKE '%'||t||'%' THEN 4 ELSE 0 END
        + CASE WHEN public.pl_norm(COALESCE(p.description,'')) LIKE '%'||t||'%' THEN 2 ELSE 0 END
        + (8 * public.similarity(public.pl_norm(p.title), t))
        + (3 * public.similarity(public.pl_norm(COALESCE(p.custom_category,'')), t))
        )
        FROM unnest(string_to_array(public.pl_norm(btrim(COALESCE(q,''))), ' ')) AS t
        WHERE btrim(t) <> ''
      ), 0)::real AS score,
      (SELECT AVG(r.rating)::numeric FROM public.reviews r WHERE r.seller_id = p.seller_id) AS seller_rating
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.status = 'published'::product_status
      AND (cat IS NULL OR c.slug = cat)
      AND (min_price IS NULL OR p.price >= min_price)
      AND (max_price IS NULL OR p.price <= max_price)
      AND (NOT COALESCE(free_only,false) OR p.price = 0)
      AND (NOT COALESCE(tradable_only,false) OR p.is_tradable IS TRUE)
      AND (min_downloads IS NULL OR COALESCE(p.downloads_count,0) >= min_downloads)
      AND (
        btrim(COALESCE(q,'')) = ''
        OR EXISTS (
          SELECT 1
          FROM unnest(string_to_array(public.pl_norm(btrim(COALESCE(q,''))), ' ')) AS t
          WHERE btrim(t) <> ''
            AND (
              public.pl_norm(p.title) LIKE '%'||t||'%'
              OR public.pl_norm(COALESCE(p.description,'')) LIKE '%'||t||'%'
              OR public.pl_norm(COALESCE(p.custom_category,'')) LIKE '%'||t||'%'
              OR public.pl_norm(COALESCE(c.name,'')) LIKE '%'||t||'%'
              OR EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE public.pl_norm(tg) LIKE '%'||t||'%')
              OR public.similarity(public.pl_norm(p.title), t) > 0.34
              OR public.similarity(public.pl_norm(COALESCE(p.custom_category,'')), t) > 0.34
              OR EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE public.similarity(public.pl_norm(tg), t) > 0.4)
            )
        )
      )
  )
  SELECT id, title, price, currency, preview_url, is_tradable, downloads_count, seller_id,
         custom_category, category_name, category_icon, category_slug, score
  FROM base
  WHERE min_seller_rating IS NULL OR COALESCE(seller_rating, 0) >= min_seller_rating
  ORDER BY
    CASE WHEN sort_by = 'price_asc' THEN price END ASC NULLS LAST,
    CASE WHEN sort_by = 'price_desc' THEN price END DESC NULLS LAST,
    CASE WHEN sort_by = 'downloads' THEN downloads_count END DESC NULLS LAST,
    CASE WHEN sort_by = 'newest' THEN created_at END DESC NULLS LAST,
    score DESC, downloads_count DESC, created_at DESC
  LIMIT 240;
$function$;

REVOKE ALL ON FUNCTION public.search_products(text, text, numeric, numeric, text, numeric, boolean, boolean, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products(text, text, numeric, numeric, text, numeric, boolean, boolean, integer) TO anon, authenticated, service_role;
