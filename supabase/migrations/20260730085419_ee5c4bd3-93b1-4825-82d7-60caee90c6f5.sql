
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET onboarding_completed = true WHERE created_at < now() - interval '1 minute';

-- like notification with actor info
CREATE OR REPLACE FUNCTION public.notify_seller_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_seller_id uuid; v_title text; v_liker text; v_liker_username text;
BEGIN
  SELECT seller_id, title INTO v_seller_id, v_title FROM public.products WHERE id = NEW.product_id;
  IF v_seller_id IS NULL OR v_seller_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username, 'Ktoś'), username INTO v_liker, v_liker_username FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (v_seller_id, 'product_liked', 'Nowe polubienie Twojego produktu ❤️',
    COALESCE(v_liker,'Ktoś') || ' dodał Twój produkt „' || COALESCE(v_title,'') || '" do polubionych',
    '/product/' || NEW.product_id::text,
    jsonb_build_object('product_id', NEW.product_id, 'actor_id', NEW.user_id, 'actor_name', v_liker, 'actor_username', v_liker_username));
  RETURN NEW;
END; $function$;

-- review notification
CREATE OR REPLACE FUNCTION public.notify_seller_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_name text; v_username text; v_title text;
BEGIN
  IF NEW.seller_id = NEW.buyer_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username, 'Ktoś'), username INTO v_name, v_username FROM public.profiles WHERE id = NEW.buyer_id;
  SELECT title INTO v_title FROM public.products WHERE id = NEW.product_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (NEW.seller_id, 'new_review', 'Nowa opinia o Tobie ⭐',
    COALESCE(v_name,'Ktoś') || ' wystawił Ci ocenę ' || NEW.rating || '/5' ||
      CASE WHEN v_title IS NOT NULL THEN ' za „' || v_title || '"' ELSE '' END ||
      CASE WHEN COALESCE(NEW.comment,'') <> '' THEN ': ' || left(NEW.comment, 140) ELSE '' END,
    CASE WHEN v_username IS NOT NULL THEN '/u/' || v_username ELSE '/dashboard' END,
    jsonb_build_object('review_id', NEW.id, 'product_id', NEW.product_id, 'actor_id', NEW.buyer_id, 'actor_name', v_name, 'actor_username', v_username));
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS notify_seller_on_review_trg ON public.reviews;
CREATE TRIGGER notify_seller_on_review_trg AFTER INSERT OR UPDATE OF rating, comment ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_on_review();

-- follow notification
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_name text; v_username text;
BEGIN
  IF NEW.follower_id = NEW.following_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username, 'Ktoś'), username INTO v_name, v_username FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (NEW.following_id, 'new_follower', 'Masz nowego obserwującego 👀',
    COALESCE(v_name,'Ktoś') || ' zaczął Cię obserwować',
    CASE WHEN v_username IS NOT NULL THEN '/u/' || v_username ELSE '/dashboard' END,
    jsonb_build_object('actor_id', NEW.follower_id, 'actor_name', v_name, 'actor_username', v_username));
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS notify_on_follow_trg ON public.follows;
CREATE TRIGGER notify_on_follow_trg AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- message notification with actor info
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE sender_name text; sender_username text;
BEGIN
  SELECT COALESCE(display_name, username, 'Użytkownik'), username INTO sender_name, sender_username FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (NEW.recipient_id, 'new_message', 'Nowa wiadomość od ' || COALESCE(sender_name, 'użytkownika'),
    left(NEW.content, 140), '/messages/' || NEW.sender_id::text,
    jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id, 'actor_id', NEW.sender_id, 'actor_name', sender_name, 'actor_username', sender_username));
  RETURN NEW;
END; $function$;

-- purchase notification with actor info
CREATE OR REPLACE FUNCTION public.notify_on_transaction_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_prod_title text; v_buyer_name text; v_buyer_username text;
BEGIN
  IF NEW.status NOT IN ('held'::transaction_status,'released'::transaction_status) THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('held'::transaction_status,'released'::transaction_status) THEN RETURN NEW; END IF;

  SELECT title INTO v_prod_title FROM public.products WHERE id = NEW.product_id;
  SELECT COALESCE(display_name, username, 'Kupujący'), username INTO v_buyer_name, v_buyer_username FROM public.profiles WHERE id = NEW.buyer_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (NEW.seller_id, 'product_sold', 'Twój produkt został sprzedany 🎉',
    COALESCE(v_buyer_name,'Ktoś') || ' kupił „' || COALESCE(v_prod_title,'produkt') || '". Kwota ' ||
      to_char(COALESCE(NEW.seller_amount, NEW.amount), 'FM999999990.00') || ' ' || COALESCE(NEW.currency,'PLN') ||
      ' zostanie wypłacona po potwierdzeniu dostawy przez kupującego.',
    '/dashboard',
    jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id, 'actor_id', NEW.buyer_id, 'actor_name', v_buyer_name, 'actor_username', v_buyer_username));

  IF NEW.affiliate_user_id IS NOT NULL AND COALESCE(NEW.affiliate_amount,0) > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (NEW.affiliate_user_id, 'affiliate_sale', 'Ktoś kupił z Twojego linku polecającego 💸',
      'Zarobiłeś ' || to_char(NEW.affiliate_amount, 'FM999999990.00') || ' ' || COALESCE(NEW.currency,'PLN') ||
      ' za polecenie „' || COALESCE(v_prod_title,'produktu') || '". Prowizja zostanie wypłacona po potwierdzeniu dostawy.',
      '/dashboard',
      jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id, 'actor_id', NEW.buyer_id, 'actor_name', v_buyer_name, 'actor_username', v_buyer_username));
  END IF;
  RETURN NEW;
END; $function$;

-- dispute notification with actor info
CREATE OR REPLACE FUNCTION public.notify_seller_on_dispute()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_prod_title text; v_name text; v_username text;
BEGIN
  IF NEW.status = 'disputed'::transaction_status AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT title INTO v_prod_title FROM public.products WHERE id = NEW.product_id;
    SELECT COALESCE(display_name, username, 'Kupujący'), username INTO v_name, v_username FROM public.profiles WHERE id = NEW.buyer_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (NEW.seller_id, 'purchase_disputed', 'Kupujący zgłosił problem z zakupem ⚠️',
      COALESCE(v_name,'Kupujący') || ' zgłosił problem z zakupem „' || COALESCE(v_prod_title,'Twojego produktu') || '".',
      '/dashboard',
      jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id, 'actor_id', NEW.buyer_id, 'actor_name', v_name, 'actor_username', v_username));
  END IF;
  RETURN NEW;
END; $function$;
