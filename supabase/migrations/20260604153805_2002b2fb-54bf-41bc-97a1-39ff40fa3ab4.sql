
-- 1) Lock down products updates
DROP POLICY IF EXISTS products_update_own ON public.products;
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (
    auth.uid() = seller_id
    AND seller_id  = (SELECT p.seller_id  FROM public.products p WHERE p.id = products.id)
    AND status     = (SELECT p.status     FROM public.products p WHERE p.id = products.id)
    AND COALESCE(review_notes,'') = COALESCE((SELECT p.review_notes FROM public.products p WHERE p.id = products.id),'')
    AND reviewed_by IS NOT DISTINCT FROM (SELECT p.reviewed_by FROM public.products p WHERE p.id = products.id)
    AND reviewed_at IS NOT DISTINCT FROM (SELECT p.reviewed_at FROM public.products p WHERE p.id = products.id)
  );

-- 2) Block direct client-side transaction inserts; only service_role (server functions) may insert
DROP POLICY IF EXISTS transactions_insert_buyer ON public.transactions;
REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM authenticated, anon;
-- (SELECT remains via transactions_select_participants policy + existing grant)
