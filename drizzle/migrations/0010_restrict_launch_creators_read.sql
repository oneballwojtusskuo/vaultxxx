DROP POLICY IF EXISTS "Launch creators are publicly readable" ON public.launch_creators;
CREATE POLICY "Launch creators with published products are readable"
ON public.launch_creators FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.seller_id = launch_creators.seller_id AND p.status = 'published'));