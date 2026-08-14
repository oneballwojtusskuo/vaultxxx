GRANT SELECT (id, seller_id, category_id, title, description, price, currency, preview_url, sample_url, tags, is_tradable, status, downloads_count, created_at, updated_at, license_terms, affiliate_commission_pct, custom_category)
  ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;