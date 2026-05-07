
-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- set_updated_at search_path
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Tighten public buckets: restrict listing to owner; reads still allowed by url
DROP POLICY IF EXISTS "previews_public_read" ON storage.objects;
CREATE POLICY "previews_read_owner" ON storage.objects FOR SELECT USING (
  bucket_id = 'product-previews' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'anon' AND false
  )
);
-- public bucket files are still served via public URL by storage; this only limits listing

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_read_owner" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
