
CREATE TABLE public.seller_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'product_rejected',
  product_title text,
  admin_note text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.seller_notifications TO authenticated;
GRANT ALL ON public.seller_notifications TO service_role;
ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.seller_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.seller_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.seller_notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_seller_notifications_user ON public.seller_notifications(user_id, created_at DESC);
