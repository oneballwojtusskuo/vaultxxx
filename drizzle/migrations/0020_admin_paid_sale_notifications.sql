CREATE UNIQUE INDEX notifications_admin_sale_transaction_unique
ON public.notifications (user_id, (data->>'transaction_id'))
WHERE type = 'admin_sale';

CREATE OR REPLACE FUNCTION public.notify_admins_paid_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_title text;
  v_seller_name text;
BEGIN
  IF COALESCE(NEW.source, 'purchase') <> 'purchase'
     OR NEW.amount <= 0
     OR NEW.stripe_env IS DISTINCT FROM 'live'
     OR NEW.stripe_payment_intent_id IS NULL
     OR NEW.status NOT IN ('held'::public.transaction_status, 'released'::public.transaction_status) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'pending'::public.transaction_status THEN RETURN NEW; END IF;
  END IF;

  SELECT title INTO v_product_title FROM public.products WHERE id = NEW.product_id;
  SELECT COALESCE(display_name, username) INTO v_seller_name FROM public.profiles WHERE id = NEW.seller_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  SELECT ur.user_id, 'admin_sale', 'Nowa opłacona sprzedaż',
    'Produkt: „' || COALESCE(v_product_title, 'produkt') || '”. Kupujący zapłacił ' ||
    to_char(NEW.amount, 'FM999999990.00') || ' ' || COALESCE(NEW.currency, 'PLN') ||
    '. Dla twórcy ' || COALESCE(v_seller_name, '') || ': ' ||
    to_char(COALESCE(NEW.seller_amount, NEW.amount), 'FM999999990.00') || ' ' || COALESCE(NEW.currency, 'PLN') || '.',
    '/admin',
    jsonb_build_object('transaction_id', NEW.id, 'product_id', NEW.product_id,
      'seller_id', NEW.seller_id, 'amount', NEW.amount,
      'seller_amount', COALESCE(NEW.seller_amount, NEW.amount), 'currency', COALESCE(NEW.currency, 'PLN'))
  FROM public.user_roles ur WHERE ur.role = 'admin'::public.app_role
  ON CONFLICT (user_id, (data->>'transaction_id')) WHERE type = 'admin_sale' DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_admins_paid_sale() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_paid_sale() TO service_role;

CREATE TRIGGER trg_notify_admins_paid_sale_insert
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_paid_sale();
CREATE TRIGGER trg_notify_admins_paid_sale_update
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_paid_sale();