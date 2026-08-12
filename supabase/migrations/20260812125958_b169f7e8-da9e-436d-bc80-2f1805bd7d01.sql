CREATE OR REPLACE FUNCTION public.pl_norm(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT translate(lower(COALESCE(t,'')),
    'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ',
    'acelnoszzacelnoszz');
$$;

CREATE OR REPLACE FUNCTION public.search_products(q text DEFAULT NULL::text, cat text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, price numeric, currency text, preview_url text, is_tradable boolean, downloads_count integer, custom_category text, category_name text, category_icon text, category_slug text, score real)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.title, p.price, p.currency, p.preview_url, p.is_tradable, p.downloads_count,
    p.custom_category, c.name, c.icon, c.slug,
    COALESCE((
      SELECT SUM(
        CASE WHEN public.pl_norm(p.title) LIKE '%'||t||'%' THEN 10 ELSE 0 END
      + CASE WHEN EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE public.pl_norm(tg) LIKE '%'||t||'%') THEN 6 ELSE 0 END
      + CASE WHEN public.pl_norm(COALESCE(p.custom_category,'')) LIKE '%'||t||'%' THEN 5 ELSE 0 END
      + CASE WHEN public.pl_norm(COALESCE(c.name,'')) LIKE '%'||t||'%' THEN 4 ELSE 0 END
      + CASE WHEN public.pl_norm(COALESCE(p.description,'')) LIKE '%'||t||'%' THEN 2 ELSE 0 END
      )
      FROM unnest(string_to_array(public.pl_norm(btrim(COALESCE(q,''))), ' ')) AS t
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
        FROM unnest(string_to_array(public.pl_norm(btrim(COALESCE(q,''))), ' ')) AS t
        WHERE btrim(t) <> ''
          AND (
            public.pl_norm(p.title) LIKE '%'||t||'%'
            OR public.pl_norm(COALESCE(p.description,'')) LIKE '%'||t||'%'
            OR public.pl_norm(COALESCE(p.custom_category,'')) LIKE '%'||t||'%'
            OR public.pl_norm(COALESCE(c.name,'')) LIKE '%'||t||'%'
            OR EXISTS (SELECT 1 FROM unnest(COALESCE(p.tags, '{}'::text[])) tg WHERE public.pl_norm(tg) LIKE '%'||t||'%')
          )
      )
    )
  ORDER BY score DESC, p.downloads_count DESC, p.created_at DESC
  LIMIT 200;
$function$;