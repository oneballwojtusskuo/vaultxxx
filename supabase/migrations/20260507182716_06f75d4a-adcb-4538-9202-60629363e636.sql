
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 6))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories (slug, name, icon) VALUES
  ('graphics','Grafika','Palette'),
  ('ebooks','E-booki','BookOpen'),
  ('music','Muzyka','Music'),
  ('code','Kod & szablony','Code'),
  ('courses','Kursy','GraduationCap'),
  ('photos','Zdjęcia','Camera'),
  ('3d','Modele 3D','Box'),
  ('other','Inne','Sparkles');

-- Products
CREATE TYPE public.product_status AS ENUM ('draft','published','sold','archived');

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PLN',
  file_path TEXT,
  preview_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_tradable BOOLEAN NOT NULL DEFAULT true,
  status product_status NOT NULL DEFAULT 'published',
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_published" ON public.products FOR SELECT USING (status = 'published' OR seller_id = auth.uid());
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- Transactions
CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed','refunded');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  status transaction_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select_participants" ON public.transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "transactions_insert_buyer" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Exchanges (trade proposals)
CREATE TYPE public.exchange_status AS ENUM ('pending','accepted','rejected','cancelled');

CREATE TABLE public.exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  requested_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  message TEXT,
  status exchange_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchanges_select_participants" ON public.exchanges FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);
CREATE POLICY "exchanges_insert_proposer" ON public.exchanges FOR INSERT WITH CHECK (auth.uid() = proposer_id);
CREATE POLICY "exchanges_update_participants" ON public.exchanges FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_exchanges_updated BEFORE UPDATE ON public.exchanges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-files','product-files', false),
  ('product-previews','product-previews', true),
  ('avatars','avatars', true)
ON CONFLICT (id) DO NOTHING;

-- product-previews: public read, owner upload
CREATE POLICY "previews_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-previews');
CREATE POLICY "previews_owner_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-previews' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "previews_owner_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-previews' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "previews_owner_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-previews' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars: public read, owner write
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_owner_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- product-files: only seller or buyers via signed urls (we'll generate via edge function later)
CREATE POLICY "files_owner_all" ON storage.objects FOR ALL USING (bucket_id = 'product-files' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'product-files' AND auth.uid()::text = (storage.foldername(name))[1]);
