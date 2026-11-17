ALTER TABLE public.products ADD COLUMN previous_price numeric, ADD COLUMN lowest_price_before_reduction numeric, ADD COLUMN price_history_started_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN reduction_reference_since timestamptz;
GRANT SELECT (previous_price, lowest_price_before_reduction, price_history_started_at, reduction_reference_since) ON public.products TO anon, authenticated;

CREATE TABLE public.product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  currency text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz
);
GRANT ALL ON public.product_price_history TO service_role;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX product_price_history_lookup ON public.product_price_history(product_id, started_at);
CREATE UNIQUE INDEX product_price_history_current ON public.product_price_history(product_id) WHERE ended_at IS NULL;
INSERT INTO public.product_price_history(product_id, price, currency, started_at) SELECT id, price, currency, price_history_started_at FROM public.products;

CREATE FUNCTION public.track_product_price_reduction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reference_price numeric; reference_since timestamptz;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.previous_price := NULL;
    NEW.lowest_price_before_reduction := NULL;
    NEW.reduction_reference_since := NULL;
    NEW.price_history_started_at := now();
    RETURN NEW;
  END IF;
  NEW.price_history_started_at := OLD.price_history_started_at;
  NEW.previous_price := OLD.previous_price;
  NEW.lowest_price_before_reduction := OLD.lowest_price_before_reduction;
  NEW.reduction_reference_since := OLD.reduction_reference_since;
  IF NEW.currency IS DISTINCT FROM OLD.currency THEN
    NEW.previous_price := NULL;
    NEW.lowest_price_before_reduction := NULL;
    NEW.reduction_reference_since := NULL;
    NEW.price_history_started_at := now();
  ELSIF NEW.price IS DISTINCT FROM OLD.price THEN
    IF NEW.price < OLD.price THEN
      reference_since := greatest(OLD.price_history_started_at, now() - interval '30 days');
      SELECT min(h.price) INTO reference_price FROM public.product_price_history h
      WHERE h.product_id = OLD.id AND h.currency = OLD.currency
        AND h.started_at <= now() AND (h.ended_at IS NULL OR h.ended_at > reference_since);
      NEW.previous_price := OLD.price;
      NEW.lowest_price_before_reduction := least(OLD.price, coalesce(reference_price, OLD.price));
      NEW.reduction_reference_since := reference_since;
    ELSE
      NEW.previous_price := NULL;
      NEW.lowest_price_before_reduction := NULL;
      NEW.reduction_reference_since := NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.track_product_price_reduction() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER products_track_price_reduction BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.track_product_price_reduction();

CREATE FUNCTION public.record_product_price_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_price_history(product_id, price, currency, started_at) VALUES (NEW.id, NEW.price, NEW.currency, now());
  ELSIF NEW.price IS DISTINCT FROM OLD.price OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    UPDATE public.product_price_history SET ended_at = now() WHERE product_id = NEW.id AND ended_at IS NULL;
    INSERT INTO public.product_price_history(product_id, price, currency, started_at) VALUES (NEW.id, NEW.price, NEW.currency, now());
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_product_price_history() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER products_record_price_history AFTER INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.record_product_price_history();