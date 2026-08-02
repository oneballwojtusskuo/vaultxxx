
ALTER TABLE public.profiles DROP COLUMN IF EXISTS payout_account;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS payout_holder;

CREATE TABLE IF NOT EXISTS public.seller_payouts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_account text NOT NULL,
  payout_holder text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.seller_payouts TO authenticated;
GRANT ALL ON public.seller_payouts TO service_role;
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read payout details"
ON public.seller_payouts FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can insert payout details"
ON public.seller_payouts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update payout details"
ON public.seller_payouts FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
