
CREATE OR REPLACE FUNCTION public.notify_admins_pending_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_name text;
BEGIN
  IF NEW.status = 'pending_review'::product_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT COALESCE(display_name, username, 'Twórca') INTO seller_name
    FROM public.profiles WHERE id = NEW.seller_id;

    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    SELECT ur.user_id,
           'product_pending_review',
           'Nowy produkt do weryfikacji',
           COALESCE(seller_name, 'Twórca') || ': ' || NEW.title,
           '/admin',
           jsonb_build_object('product_id', NEW.id, 'seller_id', NEW.seller_id)
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_admins_pending_product ON public.products;
CREATE TRIGGER trg_notify_admins_pending_product
AFTER INSERT OR UPDATE OF status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_pending_product();

CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_label text;
  product_title text;
  user_label text;
BEGIN
  IF NEW.target_type = 'product' THEN
    SELECT title INTO product_title FROM public.products WHERE id = NEW.target_id;
    target_label := 'produkt: ' || COALESCE(product_title, NEW.target_id::text);
  ELSIF NEW.target_type = 'user' THEN
    SELECT COALESCE(display_name, username, NEW.target_id::text) INTO user_label
    FROM public.profiles WHERE id = NEW.target_id;
    target_label := 'użytkownik: ' || COALESCE(user_label, NEW.target_id::text);
  ELSE
    target_label := NEW.target_type || ': ' || NEW.target_id::text;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  SELECT ur.user_id,
         'new_report',
         'Nowe zgłoszenie',
         COALESCE(NEW.reason, 'Zgłoszenie') || ' — ' || target_label,
         '/admin',
         jsonb_build_object('report_id', NEW.id, 'target_type', NEW.target_type, 'target_id', NEW.target_id)
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_report ON public.reports;
CREATE TRIGGER trg_notify_admins_new_report
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_report();
