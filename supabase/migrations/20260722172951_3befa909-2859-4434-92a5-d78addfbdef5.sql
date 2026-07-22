
-- 1) Reviews policy: allow held/released/completed/disputed
DROP POLICY IF EXISTS "Buyers can insert their own review after a completed transactio" ON public.reviews;
CREATE POLICY "Buyers can insert their own review after purchase"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id AND EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = reviews.transaction_id
      AND t.buyer_id = auth.uid()
      AND t.product_id = reviews.product_id
      AND t.seller_id = reviews.seller_id
      AND t.status IN ('held'::transaction_status,'released'::transaction_status,'completed'::transaction_status,'disputed'::transaction_status)
  )
);

-- 2) Preserve seller revenue after product deletion: SET NULL instead of CASCADE
ALTER TABLE public.transactions ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_product_id_fkey;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 3) Notification: seller "product sold" + affiliate "someone bought via your link"
CREATE OR REPLACE FUNCTION public.notify_on_transaction_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prod_title text;
  v_buyer_name text;
BEGIN
  -- Fires when transaction becomes 'held' or 'released' (paid / free instant delivery)
  IF NEW.status NOT IN ('held'::transaction_status,'released'::transaction_status) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  -- Skip if already handled (INSERT of pending, then UPDATE to held handles it once)
  IF TG_OP = 'UPDATE' AND OLD.status IN ('held'::transaction_status,'released'::transaction_status) THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_prod_title FROM public.products WHERE id = NEW.product_id;
  SELECT COALESCE(display_name, username, 'Kupujący') INTO v_buyer_name FROM public.profiles WHERE id = NEW.buyer_id;

  -- Seller notification
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (
    NEW.seller_id,
    'product_sold',
    'Twój produkt został sprzedany 🎉',
    COALESCE(v_buyer_name,'Ktoś') || ' kupił „' || COALESCE(v_prod_title,'produkt') || '". Kwota ' ||
      to_char(COALESCE(NEW.seller_amount, NEW.amount), 'FM999999990.00') || ' ' || COALESCE(NEW.currency,'PLN') ||
      ' zostanie wypłacona po potwierdzeniu dostawy przez kupującego.',
    '/dashboard',
    jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id)
  );

  -- Affiliate notification
  IF NEW.affiliate_user_id IS NOT NULL AND COALESCE(NEW.affiliate_amount,0) > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.affiliate_user_id,
      'affiliate_sale',
      'Ktoś kupił z Twojego linku polecającego 💸',
      'Zarobiłeś ' || to_char(NEW.affiliate_amount, 'FM999999990.00') || ' ' || COALESCE(NEW.currency,'PLN') ||
      ' za polecenie „' || COALESCE(v_prod_title,'produktu') || '". Prowizja zostanie wypłacona po potwierdzeniu dostawy.',
      '/dashboard',
      jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id)
    );
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_on_transaction_paid_ins ON public.transactions;
DROP TRIGGER IF EXISTS trg_notify_on_transaction_paid_upd ON public.transactions;
CREATE TRIGGER trg_notify_on_transaction_paid_ins
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_transaction_paid();
CREATE TRIGGER trg_notify_on_transaction_paid_upd
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_transaction_paid();

-- 4) Notification: seller notified when buyer disputes
CREATE OR REPLACE FUNCTION public.notify_seller_on_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prod_title text;
BEGIN
  IF NEW.status = 'disputed'::transaction_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT title INTO v_prod_title FROM public.products WHERE id = NEW.product_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.seller_id,
      'purchase_disputed',
      'Kupujący zgłosił problem z zakupem ⚠️',
      'Zakup „' || COALESCE(v_prod_title,'Twojego produktu') || '" został zgłoszony do sporu. Sprawdź szczegóły i skontaktuj się z kupującym.',
      '/dashboard',
      jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id)
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_seller_on_dispute ON public.transactions;
CREATE TRIGGER trg_notify_seller_on_dispute
AFTER INSERT OR UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_on_dispute();

-- 5) Redirect product-like notifications to the main notifications table
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
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (
    v_seller_id,
    'product_liked',
    'Nowe polubienie Twojego produktu ❤️',
    COALESCE(v_liker,'Ktoś') || ' dodał do polubionych „' || COALESCE(v_title,'') || '"',
    '/product/' || NEW.product_id::text,
    jsonb_build_object('product_id', NEW.product_id, 'liker_id', NEW.user_id)
  );
  RETURN NEW;
END; $$;
