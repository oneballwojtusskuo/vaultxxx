
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_seller boolean NOT NULL DEFAULT false;

CREATE TYPE report_target AS ENUM ('product', 'user');
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type report_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_insert_own ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY reports_select_own_or_admin ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY reports_update_admin ON public.reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status);
