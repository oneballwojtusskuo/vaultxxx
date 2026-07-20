
-- Escrow model: buyer pays price*1.10, funds held until buyer confirms delivery
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'held';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'released';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'disputed';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS buyer_price numeric(10,2);
