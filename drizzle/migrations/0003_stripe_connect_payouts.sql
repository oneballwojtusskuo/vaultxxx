CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  user_id uuid NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  stripe_account_id text NOT NULL,
  transfers_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, environment)
);
GRANT SELECT ON public.stripe_connect_accounts TO authenticated;
GRANT ALL ON public.stripe_connect_accounts TO service_role;
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own connect account readable"
  ON public.stripe_connect_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER stripe_connect_accounts_set_updated_at BEFORE UPDATE ON public.stripe_connect_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_env text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS payout_error text;

ALTER TABLE public.affiliate_payouts
  ADD COLUMN IF NOT EXISTS environment text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS error text;

-- Atomically reserves the whole available affiliate balance as a withdrawal.
CREATE OR REPLACE FUNCTION public.reserve_affiliate_withdrawal(_user_id uuid, _env text, _min numeric)
RETURNS TABLE(payout_id uuid, amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  earned numeric;
  withdrawn numeric;
  avail numeric;
  new_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('aff_wd_' || _user_id::text));
  SELECT coalesce(sum(t.affiliate_amount), 0) INTO earned
    FROM public.transactions t
    WHERE t.affiliate_user_id = _user_id AND t.status IN ('released','completed');
  SELECT coalesce(sum(p.amount), 0) INTO withdrawn
    FROM public.affiliate_payouts p
    WHERE p.user_id = _user_id AND p.status IN ('processing','paid');
  avail := round(earned - withdrawn, 2);
  IF avail < _min THEN
    RAISE EXCEPTION 'Saldo % PLN jest niższe niż próg wypłaty % PLN', avail, _min;
  END IF;
  INSERT INTO public.affiliate_payouts (user_id, amount, currency, status, environment)
  VALUES (_user_id, avail, 'PLN', 'processing', _env)
  RETURNING id INTO new_id;
  RETURN QUERY SELECT new_id, avail;
END;
$fn$;
REVOKE ALL ON FUNCTION public.reserve_affiliate_withdrawal(uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_affiliate_withdrawal(uuid, text, numeric) TO service_role;

-- Paid products need a connected Stripe account able to receive transfers.
CREATE OR REPLACE FUNCTION public.guard_paid_product_requires_connect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF coalesce(NEW.price, 0) > 0
     AND NEW.status IN ('pending_review','published')
     AND (TG_OP = 'INSERT' OR NEW.price IS DISTINCT FROM OLD.price OR OLD.status NOT IN ('pending_review','published'))
     AND NOT EXISTS (
       SELECT 1 FROM public.stripe_connect_accounts c
       WHERE c.user_id = NEW.seller_id AND c.transfers_enabled
     )
  THEN
    RAISE EXCEPTION 'Aby wystawić płatny produkt, połącz najpierw konto Stripe w panelu (Wypłaty).'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS products_require_connect ON public.products;
CREATE TRIGGER products_require_connect BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_paid_product_requires_connect();

-- Raw bank account numbers are no longer collected.
REVOKE ALL ON public.seller_payouts FROM authenticated, anon;
COMMENT ON TABLE public.seller_payouts IS 'DEPRECATED: replaced by stripe_connect_accounts (Stripe Connect). Do not use.';