CREATE OR REPLACE FUNCTION public.notify_seller_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seller_id uuid;
  v_title text;
  v_liker text;
BEGIN
  SELECT seller_id, title INTO v_seller_id, v_title FROM public.products WHERE id = NEW.product_id;
  IF v_seller_id IS NULL OR v_seller_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(display_name, username, 'Ktoś') INTO v_liker FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.seller_notifications (user_id, type, title, body, link)
  VALUES (
    v_seller_id,
    'product_liked',
    'Nowe polubienie produktu',
    COALESCE(v_liker, 'Ktoś') || ' polubił Twój produkt „' || COALESCE(v_title, '') || '"',
    '/product/' || NEW.product_id::text
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_seller_on_like() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_seller_on_like_trg ON public.product_likes;
CREATE TRIGGER notify_seller_on_like_trg
AFTER INSERT ON public.product_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_on_like();