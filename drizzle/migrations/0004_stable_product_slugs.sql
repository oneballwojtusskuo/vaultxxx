ALTER TABLE public.products ADD COLUMN slug text;
CREATE UNIQUE INDEX products_slug_unique ON public.products (slug);
CREATE FUNCTION public.assign_product_slug() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE base text; candidate text; suffix integer := 1;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL THEN
    NEW.slug := OLD.slug;
    RETURN NEW;
  END IF;
  base := trim(both '-' from regexp_replace(lower(translate(normalize(NEW.title, NFD), 'łŁ', 'lL')), '[^a-z0-9]+', '-', 'g'));
  base := trim(trailing '-' from left(base, 80));
  IF base = '' THEN base := 'produkt'; END IF;
  IF base ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN base := 'produkt-' || base; END IF;
  PERFORM pg_advisory_xact_lock(728419);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = candidate AND id <> NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_product_slug() FROM PUBLIC;
CREATE TRIGGER assign_product_slug_trg BEFORE INSERT OR UPDATE OF slug ON public.products FOR EACH ROW EXECUTE FUNCTION public.assign_product_slug();
UPDATE public.products SET slug = null WHERE slug IS NULL;
ALTER TABLE public.products ADD CONSTRAINT products_slug_format CHECK (slug IS NOT NULL AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
COMMENT ON COLUMN public.products.slug IS 'Stable unique public URL identifier generated from the initial title; immutable after assignment.';