
REVOKE EXECUTE ON FUNCTION public.notify_on_exchange_proposed() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.grant_access_on_exchange_accepted() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_funds_released() FROM anon, authenticated, public;
