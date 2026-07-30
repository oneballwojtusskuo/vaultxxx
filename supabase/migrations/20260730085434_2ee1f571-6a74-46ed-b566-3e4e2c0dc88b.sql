
REVOKE ALL ON FUNCTION public.notify_seller_on_review() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_seller_on_like() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_transaction_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_seller_on_dispute() FROM PUBLIC, anon, authenticated;
