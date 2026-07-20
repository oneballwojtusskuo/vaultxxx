
-- Products: affiliate commission percentage set by seller
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS affiliate_commission_pct integer NOT NULL DEFAULT 0
  CHECK (affiliate_commission_pct >= 0 AND affiliate_commission_pct <= 50);

-- Transactions: split-payment fields
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS affiliate_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS affiliate_commission_pct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_pct integer NOT NULL DEFAULT 10;

CREATE INDEX IF NOT EXISTS transactions_affiliate_user_id_idx
  ON public.transactions(affiliate_user_id);

-- Allow the referring affiliate to see transactions they earned on
DROP POLICY IF EXISTS transactions_select_affiliate ON public.transactions;
CREATE POLICY transactions_select_affiliate ON public.transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = affiliate_user_id);
