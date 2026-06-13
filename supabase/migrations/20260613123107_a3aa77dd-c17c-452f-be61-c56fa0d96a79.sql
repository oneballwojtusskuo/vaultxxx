
DROP POLICY IF EXISTS exchanges_update_receiver ON public.exchanges;
CREATE POLICY exchanges_update_receiver ON public.exchanges
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id
    AND proposer_id          = (SELECT e.proposer_id          FROM public.exchanges e WHERE e.id = exchanges.id)
    AND receiver_id          = (SELECT e.receiver_id          FROM public.exchanges e WHERE e.id = exchanges.id)
    AND offered_product_id   = (SELECT e.offered_product_id   FROM public.exchanges e WHERE e.id = exchanges.id)
    AND requested_product_id = (SELECT e.requested_product_id FROM public.exchanges e WHERE e.id = exchanges.id)
  );

DROP POLICY IF EXISTS files_buyer_read ON storage.objects;
CREATE POLICY files_buyer_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'product-files'
    AND EXISTS (
      SELECT 1
      FROM public.transactions t
      JOIN public.products p ON p.id = t.product_id
      WHERE t.buyer_id = auth.uid()
        AND t.status = 'completed'
        AND p.file_path = storage.objects.name
    )
  );

REVOKE SELECT ON public.products FROM anon;
GRANT SELECT
  (id, seller_id, category_id, title, description, price, currency,
   preview_url, sample_url, tags, status, is_tradable, license_terms,
   downloads_count, created_at, updated_at)
  ON public.products TO anon;

-- Default product status should be pending_review, not auto-published
ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'pending_review'::product_status;

DROP POLICY IF EXISTS products_insert_own ON public.products;
CREATE POLICY products_insert_own ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = seller_id
    AND status = 'pending_review'::product_status
  );

DROP POLICY IF EXISTS transactions_insert_blocked ON public.transactions;
CREATE POLICY transactions_insert_blocked ON public.transactions
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS user_roles_insert_blocked_anon ON public.user_roles;
CREATE POLICY user_roles_insert_blocked_anon ON public.user_roles
  FOR INSERT TO anon
  WITH CHECK (false);
