ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS stripe_session_id text;
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON public.transactions(stripe_session_id);