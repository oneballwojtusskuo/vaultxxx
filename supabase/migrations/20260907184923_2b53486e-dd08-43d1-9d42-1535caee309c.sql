CREATE TABLE public.transaction_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'checkout',
  ip_address text,
  user_agent text,
  timestamp_checkout timestamptz,
  timestamp_downloaded timestamptz,
  withdrawal_waiver_accepted boolean NOT NULL DEFAULT false,
  license_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.transaction_audit_logs TO authenticated;
GRANT ALL ON public.transaction_audit_logs TO service_role;

ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own"
ON public.transaction_audit_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_audit_logs_tx ON public.transaction_audit_logs (transaction_id);
CREATE INDEX idx_audit_logs_user ON public.transaction_audit_logs (user_id);