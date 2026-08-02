
-- 1. Payout details on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_account text,
  ADD COLUMN IF NOT EXISTS payout_holder text;

-- 2. Transactions: mark where access came from
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'purchase';

-- 3. Case-insensitive unique usernames
UPDATE public.profiles p
SET username = 'user_' || substr(replace(p.id::text,'-',''),1,10)
WHERE p.username IS NULL
   OR EXISTS (
     SELECT 1 FROM public.profiles q
     WHERE q.id <> p.id AND lower(q.username) = lower(p.username) AND q.created_at < p.created_at
   );

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));

-- 4. Reset e-mail derived names so the user picks their own
UPDATE public.profiles p
SET display_name = NULL,
    onboarding_completed = false
FROM auth.users u
WHERE u.id = p.id
  AND p.display_name IS NOT NULL
  AND lower(p.display_name) = lower(split_part(u.email, '@', 1));

UPDATE public.profiles p
SET username = 'user_' || substr(replace(p.id::text,'-',''),1,10),
    onboarding_completed = false
FROM auth.users u
WHERE u.id = p.id
  AND p.username LIKE lower(split_part(u.email, '@', 1)) || '\_%';

-- 5. New signups get neutral placeholders, never e-mail derived names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_email CONSTANT text := 'chujcinaryjsuko@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, display_name, username, onboarding_completed)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NULLIF(lower(NEW.raw_user_meta_data->>'username'), ''), 'user_' || substr(replace(NEW.id::text,'-',''),1,10)),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) = lower(v_owner_email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. Nobody can like their own product
DROP POLICY IF EXISTS "Users can like products" ON public.product_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.product_likes;
CREATE POLICY "Users can like other people products"
ON public.product_likes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = auth.uid())
);

-- 7. Multi-file exchanges
CREATE TABLE IF NOT EXISTS public.exchange_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('offered','requested')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exchange_id, product_id, side)
);

GRANT SELECT, INSERT, DELETE ON public.exchange_items TO authenticated;
GRANT ALL ON public.exchange_items TO service_role;
ALTER TABLE public.exchange_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read exchange items" ON public.exchange_items;
CREATE POLICY "Participants can read exchange items"
ON public.exchange_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exchanges e
  WHERE e.id = exchange_id AND (e.proposer_id = auth.uid() OR e.receiver_id = auth.uid())
));

DROP POLICY IF EXISTS "Proposer can add exchange items" ON public.exchange_items;
CREATE POLICY "Proposer can add exchange items"
ON public.exchange_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exchanges e
  WHERE e.id = exchange_id AND e.proposer_id = auth.uid() AND e.status = 'pending'
));

DROP POLICY IF EXISTS "Proposer can remove exchange items" ON public.exchange_items;
CREATE POLICY "Proposer can remove exchange items"
ON public.exchange_items FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exchanges e
  WHERE e.id = exchange_id AND e.proposer_id = auth.uid() AND e.status = 'pending'
));

-- 8. Notify the receiver about a new exchange proposal
CREATE OR REPLACE FUNCTION public.notify_on_exchange_proposed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_name text; v_username text;
BEGIN
  SELECT COALESCE(display_name, username), username INTO v_name, v_username
  FROM public.profiles WHERE id = NEW.proposer_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (NEW.receiver_id, 'exchange_proposed', 'Masz nową propozycję wymiany 🔁',
    COALESCE(v_name, 'Ktoś') || ' proponuje Ci wymianę produktów. Otwórz sekcję Wymiany, aby odpowiedzieć lub negocjować.',
    '/exchanges',
    jsonb_build_object('exchange_id', NEW.id, 'actor_id', NEW.proposer_id, 'actor_name', v_name, 'actor_username', v_username));
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_on_exchange_proposed_trg ON public.exchanges;
CREATE TRIGGER notify_on_exchange_proposed_trg
AFTER INSERT ON public.exchanges
FOR EACH ROW EXECUTE FUNCTION public.notify_on_exchange_proposed();

-- 9. Accepted exchange -> mutual access + notifications
CREATE OR REPLACE FUNCTION public.grant_access_on_exchange_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE r record; v_proposer text; v_receiver text;
BEGIN
  IF NEW.status <> 'accepted'::exchange_status OR OLD.status = NEW.status THEN RETURN NEW; END IF;

  FOR r IN
    SELECT product_id, side FROM public.exchange_items WHERE exchange_id = NEW.id
    UNION
    SELECT NEW.offered_product_id, 'offered'
    UNION
    SELECT NEW.requested_product_id, 'requested'
  LOOP
    IF r.product_id IS NULL THEN CONTINUE; END IF;
    INSERT INTO public.transactions (product_id, buyer_id, seller_id, amount, buyer_price, seller_amount, platform_amount, currency, status, source)
    SELECT r.product_id,
           CASE WHEN r.side = 'offered' THEN NEW.receiver_id ELSE NEW.proposer_id END,
           CASE WHEN r.side = 'offered' THEN NEW.proposer_id ELSE NEW.receiver_id END,
           0, 0, 0, 0, 'PLN', 'released'::transaction_status, 'exchange'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.product_id = r.product_id
        AND t.buyer_id = CASE WHEN r.side = 'offered' THEN NEW.receiver_id ELSE NEW.proposer_id END
        AND t.status IN ('held','released','completed','disputed')
    );
  END LOOP;

  SELECT COALESCE(display_name, username) INTO v_proposer FROM public.profiles WHERE id = NEW.proposer_id;
  SELECT COALESCE(display_name, username) INTO v_receiver FROM public.profiles WHERE id = NEW.receiver_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES
    (NEW.proposer_id, 'exchange_accepted', 'Wymiana zaakceptowana ✅',
      COALESCE(v_receiver,'Użytkownik') || ' zaakceptował wymianę. Pliki są już dostępne w sekcji Zakupy.', '/dashboard',
      jsonb_build_object('exchange_id', NEW.id, 'actor_id', NEW.receiver_id, 'actor_name', v_receiver)),
    (NEW.receiver_id, 'exchange_accepted', 'Wymiana zaakceptowana ✅',
      'Wymiana z ' || COALESCE(v_proposer,'użytkownikiem') || ' została sfinalizowana. Pliki są już dostępne w sekcji Zakupy.', '/dashboard',
      jsonb_build_object('exchange_id', NEW.id, 'actor_id', NEW.proposer_id, 'actor_name', v_proposer));
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS grant_access_on_exchange_accepted_trg ON public.exchanges;
CREATE TRIGGER grant_access_on_exchange_accepted_trg
AFTER UPDATE ON public.exchanges
FOR EACH ROW EXECUTE FUNCTION public.grant_access_on_exchange_accepted();

-- 10. Funds released -> notify seller (and affiliate)
CREATE OR REPLACE FUNCTION public.notify_on_funds_released()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_title text; v_buyer text; v_buyer_username text;
BEGIN
  IF COALESCE(NEW.source,'purchase') <> 'purchase' THEN RETURN NEW; END IF;
  IF NEW.status <> 'released'::transaction_status OR OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT title INTO v_title FROM public.products WHERE id = NEW.product_id;
  SELECT COALESCE(display_name, username), username INTO v_buyer, v_buyer_username FROM public.profiles WHERE id = NEW.buyer_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (NEW.seller_id, 'funds_released', 'Kupujący zatwierdził produkt — środki wypłacone 💰',
    COALESCE(v_buyer,'Kupujący') || ' potwierdził odbiór „' || COALESCE(v_title,'produktu') || '". Kwota ' ||
      to_char(COALESCE(NEW.seller_amount, NEW.amount), 'FM999999990.00') || ' ' || COALESCE(NEW.currency,'PLN') ||
      ' została zwolniona z depozytu do wypłaty.',
    '/dashboard',
    jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id, 'actor_id', NEW.buyer_id, 'actor_name', v_buyer, 'actor_username', v_buyer_username));

  IF NEW.affiliate_user_id IS NOT NULL AND COALESCE(NEW.affiliate_amount,0) > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (NEW.affiliate_user_id, 'affiliate_released', 'Prowizja z polecenia zwolniona 💸',
      'Twoja prowizja ' || to_char(NEW.affiliate_amount, 'FM999999990.00') || ' ' || COALESCE(NEW.currency,'PLN') ||
      ' za „' || COALESCE(v_title,'produkt') || '" została zwolniona do wypłaty.', '/dashboard',
      jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_on_funds_released_trg ON public.transactions;
CREATE TRIGGER notify_on_funds_released_trg
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_funds_released();

-- 11. Do not fire "sold" notification for exchange grants
CREATE OR REPLACE FUNCTION public.notify_on_transaction_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_prod_title text; v_buyer_name text; v_buyer_username text;
BEGIN
  IF COALESCE(NEW.source,'purchase') <> 'purchase' THEN RETURN NEW; END IF;
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
END;
$function$;
