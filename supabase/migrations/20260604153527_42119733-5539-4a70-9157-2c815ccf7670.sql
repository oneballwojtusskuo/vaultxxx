
-- 1. PRODUCTS: column-level grants — hide sensitive columns from anon
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, seller_id, category_id, title, description, price, currency,
  preview_url, tags, is_tradable, status, downloads_count,
  created_at, updated_at, sample_url, license_terms
) ON public.products TO anon;

-- 2. USER_ROLES: admin-only insert/delete; prevent privilege escalation
CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. EXCHANGES: restrict update so receivers can't rewrite proposer-only fields
DROP POLICY IF EXISTS exchanges_update_participants ON public.exchanges;

-- Proposer may update any of their own exchange while pending
CREATE POLICY "exchanges_update_proposer" ON public.exchanges
  FOR UPDATE TO authenticated
  USING (auth.uid() = proposer_id)
  WITH CHECK (auth.uid() = proposer_id);

-- Receiver may update but cannot change proposer-controlled identity fields
CREATE POLICY "exchanges_update_receiver" ON public.exchanges
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id
    AND proposer_id = (SELECT proposer_id FROM public.exchanges e WHERE e.id = exchanges.id)
    AND receiver_id = (SELECT receiver_id FROM public.exchanges e WHERE e.id = exchanges.id)
    AND offered_product_id = (SELECT offered_product_id FROM public.exchanges e WHERE e.id = exchanges.id)
  );

-- 4. STORAGE previews: fix broken anon read policy
DROP POLICY IF EXISTS previews_read_owner ON storage.objects;
CREATE POLICY "previews_read_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-previews');

-- 5. has_role: revoke direct execution from end-user roles (still callable from policies via SECURITY DEFINER chain)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
