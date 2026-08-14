-- 1. Hide date_of_birth from public/authenticated column reads on profiles
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, avatar_url, bio, created_at, updated_at, is_verified_seller, is_banned, onboarding_completed)
  ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Owner/admin can read their own birth date through this function
CREATE OR REPLACE FUNCTION public.get_my_date_of_birth()
RETURNS date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date_of_birth FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_date_of_birth() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_date_of_birth() TO authenticated;

-- 2. search_products no longer needs elevated privileges (products has a public SELECT policy)
ALTER FUNCTION public.search_products(text, text) SECURITY INVOKER;

-- 3. Trigger-only functions must not be directly executable
REVOKE ALL ON FUNCTION public.guard_product_delete_with_sales() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_product_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_is_banned() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_verified_seller() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_access_on_exchange_accepted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_owner_admin_on_verified_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_new_report() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_pending_product() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_followers_on_publish() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_exchange_proposed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_funds_released() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_transaction_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_seller_on_dispute() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_seller_on_like() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_seller_on_review() FROM PUBLIC, anon, authenticated;