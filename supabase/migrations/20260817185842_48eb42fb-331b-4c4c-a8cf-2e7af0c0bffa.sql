
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow update for moderation" ON public.products;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categories','consents','cookie_consents','dac7_reports','exchange_items','exchanges',
    'follows','messages','notifications','privacy_requests','product_likes','products',
    'profiles','reports','reviews','seller_notifications','seller_payouts',
    'seller_tax_profiles','transactions','user_roles'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;

  -- Anonimowi mogą tylko czytać dane publiczne
  FOREACH t IN ARRAY ARRAY['categories','products','profiles','reviews','follows','product_likes'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
  END LOOP;
END $$;
