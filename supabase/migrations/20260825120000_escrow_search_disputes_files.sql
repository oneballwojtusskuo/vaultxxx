-- Escrow 24h, dispute chat, multi-file products, search, avatars, welcome notice.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ---------------------------------------------------------------------------
-- Text normalization for search (ignore Polish diacritics, case, #hashtags)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pl_norm(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $fn$
  SELECT regexp_replace(
    translate(
      lower(public.unaccent(replace(replace(coalesce(t, ''), '#', ' '), '_', ' '))),
      'ł',
      'l'
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  );
$fn$;

-- ---------------------------------------------------------------------------
-- Transactions / escrow
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS held_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_release_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'held',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

UPDATE public.transactions
SET held_at = coalesce(held_at, created_at),
    auto_release_at = coalesce(auto_release_at, created_at + interval '24 hours')
WHERE status = 'held' AND held_at IS NULL;

-- ---------------------------------------------------------------------------
-- Products: multiple files + AI review fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS file_paths text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_review_status text,
  ADD COLUMN IF NOT EXISTS ai_review_notes text;

UPDATE public.products
SET file_paths = ARRAY[file_path]
WHERE file_path IS NOT NULL
  AND file_path <> ''
  AND (file_paths IS NULL OR cardinality(file_paths) = 0);

-- ---------------------------------------------------------------------------
-- Dispute threads (buyer + seller + admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispute_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.dispute_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dispute_messages_thread_idx ON public.dispute_messages(thread_id, created_at);

ALTER TABLE public.dispute_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.dispute_threads TO authenticated;
GRANT SELECT ON public.dispute_messages TO authenticated;
GRANT ALL ON public.dispute_threads TO service_role;
GRANT ALL ON public.dispute_messages TO service_role;

DROP POLICY IF EXISTS dispute_threads_select ON public.dispute_threads;
CREATE POLICY dispute_threads_select ON public.dispute_threads
  FOR SELECT TO authenticated
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR public.is_current_user_admin()
  );

DROP POLICY IF EXISTS dispute_messages_select ON public.dispute_messages;
CREATE POLICY dispute_messages_select ON public.dispute_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dispute_threads t
      WHERE t.id = thread_id
        AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR public.is_current_user_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- Auto-release held escrow after 24h (no dispute)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_expired_escrow()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  n integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT id, seller_id, buyer_id, seller_amount, currency
    FROM public.transactions
    WHERE status = 'held'
      AND coalesce(auto_release_at, held_at + interval '24 hours', created_at + interval '24 hours') <= now()
  LOOP
    UPDATE public.transactions
    SET status = 'released',
        released_at = now(),
        payout_status = 'queued'
    WHERE id = r.id AND status = 'held';

    IF FOUND THEN
      n := n + 1;
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        r.seller_id,
        'funds_released',
        'Środki zwolnione z depozytu',
        'Kupujący nie zgłosił problemu w ciągu 24 godzin — ' || to_char(r.seller_amount, 'FM999999990.00') || ' ' || r.currency || ' zostało zwolnione do wypłaty.',
        '/dashboard?tab=sales'
      );
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        r.buyer_id,
        'escrow_auto_accepted',
        'Zakup uznany za zaakceptowany',
        'Nie potwierdzono odbioru ani nie zgłoszono problemu w ciągu 24 godzin. Środki trafiły do sprzedawcy.',
        '/dashboard?tab=purchases'
      );
    END IF;
  END LOOP;
  RETURN n;
END;
$fn$;

REVOKE ALL ON FUNCTION public.release_expired_escrow() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_expired_escrow() TO service_role;

-- ---------------------------------------------------------------------------
-- Welcome notification on account (profile) creation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_welcome_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (
    NEW.id,
    'welcome',
    'Witaj w vlnd — dziękujemy za konto!',
    'Krótki start: 1) Uzupełnij profil (zdjęcie, nazwa). 2) Odkrywaj — filtruj po cenie, kategorii i ocenie twórcy. 3) Kupując, masz 24h na sprawdzenie pliku albo zgłoszenie problemu. 4) Wystaw własne pliki w „Wystaw”. 5) Linki polecające znajdziesz na stronie produktu. W razie kłopotów: Centrum pomocy.',
    '/help',
    jsonb_build_object('tutorial', true)
  );
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_notify_welcome_on_profile ON public.profiles;
CREATE TRIGGER trg_notify_welcome_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome_on_profile();

-- ---------------------------------------------------------------------------
-- Avatars: public read + owner write (fixes profile photo upload/display)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_owner_insert ON storage.objects;
CREATE POLICY avatars_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS avatars_owner_delete ON storage.objects;
CREATE POLICY avatars_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ---------------------------------------------------------------------------
-- Search with filters; match title, description, tags/hashtags, category
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_products(text, text);

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
  score real,
  seller_id uuid,
  seller_rating numeric,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  WITH rated AS (
    SELECT r.seller_id, avg(r.rating)::numeric(4,2) AS avg_rating, count(*)::int AS review_count
    FROM public.reviews r
    GROUP BY r.seller_id
  ),
  tokens AS (
    SELECT btrim(t) AS t
    FROM unnest(string_to_array(public.pl_norm(btrim(coalesce(q, ''))), ' ')) AS t
    WHERE btrim(t) <> ''
  )
  SELECT
    p.id, p.title, p.price, p.currency, p.preview_url, p.is_tradable, p.downloads_count,
    p.custom_category, c.name, c.icon, c.slug,
    CASE WHEN coalesce(q, '') = '' THEN 0 ELSE coalesce((
      SELECT SUM(
        CASE WHEN public.pl_norm(p.title) LIKE '%'||tok.t||'%' THEN 12 ELSE 0 END
      + CASE WHEN public.pl_norm(coalesce(p.description,'')) LIKE '%'||tok.t||'%' THEN 4 ELSE 0 END
      + CASE WHEN public.pl_norm(array_to_string(coalesce(p.tags, '{}'), ' ')) LIKE '%'||tok.t||'%' THEN 8 ELSE 0 END
      + CASE WHEN EXISTS (
            SELECT 1 FROM unnest(coalesce(p.tags, '{}'::text[])) tg
            WHERE public.pl_norm(tg) LIKE '%'||tok.t||'%'
               OR public.similarity(public.pl_norm(tg), tok.t) > 0.35
        ) THEN 8 ELSE 0 END
      + CASE WHEN public.pl_norm(coalesce(p.custom_category,'')) LIKE '%'||tok.t||'%' THEN 5 ELSE 0 END
      + CASE WHEN public.pl_norm(coalesce(c.name,'')) LIKE '%'||tok.t||'%' THEN 4 ELSE 0 END
      + (10 * public.similarity(public.pl_norm(p.title), tok.t))
      + (4 * public.similarity(public.pl_norm(coalesce(p.description,'')), tok.t))
      )
      FROM tokens tok
    ), 0) END::real AS score,
    p.seller_id,
    coalesce(rated.avg_rating, 0),
    p.tags
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  LEFT JOIN rated ON rated.seller_id = p.seller_id
  WHERE p.status = 'published'::product_status
    AND (cat IS NULL OR c.slug = cat)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (NOT free_only OR p.price = 0)
    AND (NOT tradable_only OR p.is_tradable)
    AND (min_downloads IS NULL OR p.downloads_count >= min_downloads)
    AND (min_seller_rating IS NULL OR coalesce(rated.avg_rating, 0) >= min_seller_rating)
    AND (
      btrim(coalesce(q,'')) = ''
      OR EXISTS (
        SELECT 1 FROM tokens tok
        WHERE
          public.pl_norm(p.title) LIKE '%'||tok.t||'%'
          OR public.pl_norm(coalesce(p.description,'')) LIKE '%'||tok.t||'%'
          OR public.pl_norm(array_to_string(coalesce(p.tags, '{}'), ' ')) LIKE '%'||tok.t||'%'
          OR public.pl_norm(coalesce(p.custom_category,'')) LIKE '%'||tok.t||'%'
          OR public.pl_norm(coalesce(c.name,'')) LIKE '%'||tok.t||'%'
          OR EXISTS (
            SELECT 1 FROM unnest(coalesce(p.tags, '{}'::text[])) tg
            WHERE public.pl_norm(tg) LIKE '%'||tok.t||'%'
               OR public.similarity(public.pl_norm(tg), tok.t) > 0.35
          )
          OR public.similarity(public.pl_norm(p.title), tok.t) > 0.28
          OR public.similarity(public.pl_norm(coalesce(p.description,'')), tok.t) > 0.32
      )
    )
  ORDER BY
    CASE WHEN sort_by = 'price_asc' THEN p.price END ASC NULLS LAST,
    CASE WHEN sort_by = 'price_desc' THEN p.price END DESC NULLS LAST,
    CASE WHEN sort_by = 'popular' THEN p.downloads_count END DESC NULLS LAST,
    CASE WHEN sort_by = 'rating' THEN coalesce(rated.avg_rating, 0) END DESC NULLS LAST,
    CASE WHEN sort_by = 'newest' THEN p.created_at END DESC NULLS LAST,
    score DESC,
    p.downloads_count DESC,
    p.created_at DESC
  LIMIT 240;
$function$;

REVOKE ALL ON FUNCTION public.search_products(
  text, text, numeric, numeric, text, numeric, boolean, boolean, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products(
  text, text, numeric, numeric, text, numeric, boolean, boolean, integer
) TO anon, authenticated, service_role;
