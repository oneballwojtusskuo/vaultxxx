ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS malware_scan_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS malware_scan_notes text,
  ADD COLUMN IF NOT EXISTS malware_scanned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_review_status text,
  ADD COLUMN IF NOT EXISTS ai_review_notes text;

CREATE OR REPLACE FUNCTION public.guard_product_malware_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'published'::product_status AND NEW.malware_scan_status = 'infected' THEN
    RAISE EXCEPTION 'Produkt nie moze zostac opublikowany: plik oznaczony jako zainfekowany'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_product_malware_block_trg ON public.products;
CREATE TRIGGER guard_product_malware_block_trg
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_malware_block();

-- Restrict public profile reads to non-sensitive columns (date_of_birth stays server-only)
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, avatar_url, bio, is_verified_seller, is_banned, onboarding_completed, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;