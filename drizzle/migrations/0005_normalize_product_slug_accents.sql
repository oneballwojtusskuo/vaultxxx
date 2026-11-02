CREATE OR REPLACE FUNCTION public.assign_product_slug() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE base text; candidate text; suffix integer := 1;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL THEN NEW.slug := OLD.slug; RETURN NEW; END IF;
  base := regexp_replace(normalize(lower(translate(NEW.title, 'łŁ', 'lL')), NFD), U&'[\0300-\036f]', '', 'g');
  base := trim(both '-' from regexp_replace(base, '[^a-z0-9]+', '-', 'g'));
  base := trim(trailing '-' from left(base, 80));
  IF base = '' THEN base := 'produkt'; END IF;
  IF base ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN base := 'produkt-' || base; END IF;
  PERFORM pg_advisory_xact_lock(728419);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = candidate AND id <> NEW.id) LOOP suffix := suffix + 1; candidate := base || '-' || suffix::text; END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;
ALTER TABLE public.products DISABLE TRIGGER assign_product_slug_trg;
UPDATE public.products SET slug = 'oficjalny-przewodnik-sprzedazy-na-vlnd-pl' WHERE id = '2dca51b6-649e-4e9e-a787-cb838e7fc800' AND slug = 'oficjalny-przewodnik-sprzedaz-y-na-vlnd-pl';
ALTER TABLE public.products ENABLE TRIGGER assign_product_slug_trg;