REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (id, seller_id, category_id, title, description, price, currency, preview_url, tags, is_tradable, status, downloads_count, created_at, updated_at, sample_url, license_terms, affiliate_commission_pct, custom_category, slug) ON public.products TO anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.transactions FROM anon, authenticated;
REVOKE ALL ON public.transactions FROM anon;
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
CREATE OR REPLACE FUNCTION public.guard_product_private_paths() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE file_name text;
BEGIN
  IF NEW.file_path IS NOT NULL AND (NEW.file_path NOT LIKE NEW.seller_id::text || '/%' OR position('..' in NEW.file_path) > 0) THEN
    RAISE EXCEPTION 'Product file must belong to the listing creator' USING ERRCODE = '42501';
  END IF;
  FOREACH file_name IN ARRAY COALESCE(NEW.file_paths, ARRAY[]::text[]) LOOP
    IF file_name NOT LIKE NEW.seller_id::text || '/%' OR position('..' in file_name) > 0 THEN
      RAISE EXCEPTION 'Product file must belong to the listing creator' USING ERRCODE = '42501';
    END IF;
  END LOOP;
  IF TG_OP = 'UPDATE' AND auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.seller_id := OLD.seller_id;
    NEW.status := OLD.status;
    NEW.review_notes := OLD.review_notes;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.malware_scan_status := OLD.malware_scan_status;
    NEW.malware_scan_notes := OLD.malware_scan_notes;
    NEW.ai_review_status := OLD.ai_review_status;
    NEW.ai_review_notes := OLD.ai_review_notes;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_product_private_paths_trigger BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_private_paths();