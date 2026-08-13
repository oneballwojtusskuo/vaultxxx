-- DAC7: seller tax profiles + owner reporting snapshots.

CREATE TABLE IF NOT EXISTS public.seller_tax_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_kind text NOT NULL CHECK (seller_kind IN ('private','business')),
  full_name text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'PL',
  tin text NOT NULL,
  date_of_birth date,
  birth_place text,
  vat_id text,
  business_reg_no text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.seller_tax_profiles TO authenticated;
GRANT ALL ON public.seller_tax_profiles TO service_role;

ALTER TABLE public.seller_tax_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tax profile" ON public.seller_tax_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

CREATE POLICY "Users insert own tax profile" ON public.seller_tax_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tax profile" ON public.seller_tax_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER seller_tax_profiles_set_updated_at BEFORE UPDATE ON public.seller_tax_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.dac7_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  tx_count int NOT NULL DEFAULT 0,
  gross_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PLN',
  reported boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year)
);

GRANT ALL ON public.dac7_reports TO service_role;
GRANT SELECT ON public.dac7_reports TO authenticated;

ALTER TABLE public.dac7_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read dac7 reports" ON public.dac7_reports
  FOR SELECT TO authenticated USING (public.is_current_user_admin());
