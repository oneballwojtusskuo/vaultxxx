
UPDATE public.notifications
SET link = '/dashboard?tab=purchases'
WHERE type IN ('exchange_accepted') AND link = '/dashboard';

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
      COALESCE(v_receiver,'Użytkownik') || ' zaakceptował wymianę. Pliki są już dostępne w sekcji Zakupy.', '/dashboard?tab=purchases',
      jsonb_build_object('exchange_id', NEW.id, 'actor_id', NEW.receiver_id, 'actor_name', v_receiver)),
    (NEW.receiver_id, 'exchange_accepted', 'Wymiana zaakceptowana ✅',
      'Wymiana z ' || COALESCE(v_proposer,'użytkownikiem') || ' została sfinalizowana. Pliki są już dostępne w sekcji Zakupy.', '/dashboard?tab=purchases',
      jsonb_build_object('exchange_id', NEW.id, 'actor_id', NEW.proposer_id, 'actor_name', v_proposer));
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.grant_access_on_exchange_accepted() FROM anon, authenticated;
