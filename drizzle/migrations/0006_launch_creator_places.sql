CREATE SEQUENCE public.launch_creator_slot_seq AS integer START WITH 1 NO MAXVALUE NO CYCLE;

CREATE TABLE public.launch_creators (
  seller_id uuid PRIMARY KEY,
  product_id uuid NOT NULL,
  slot integer NOT NULL UNIQUE CHECK (slot BETWEEN 1 AND 30),
  awarded_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.launch_creators TO anon, authenticated;
GRANT ALL ON public.launch_creators TO service_role;

ALTER TABLE public.launch_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Launch creators are publicly readable"
ON public.launch_creators
FOR SELECT
TO anon, authenticated
USING (true);

REVOKE ALL ON SEQUENCE public.launch_creator_slot_seq FROM PUBLIC, anon, authenticated;
GRANT ALL ON SEQUENCE public.launch_creator_slot_seq TO service_role;

CREATE OR REPLACE FUNCTION public.grant_launch_creator_place(
  _seller_id uuid,
  _product_id uuid,
  _product_title text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_slot integer;
  next_slot integer;
BEGIN
  SELECT slot INTO existing_slot
  FROM public.launch_creators
  WHERE seller_id = _seller_id;

  IF existing_slot IS NOT NULL THEN
    RETURN existing_slot;
  END IF;

  PERFORM pg_advisory_xact_lock(76119830);
  next_slot := nextval('public.launch_creator_slot_seq');

  IF next_slot > 30 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.launch_creators (seller_id, product_id, slot)
  VALUES (_seller_id, _product_id, next_slot)
  ON CONFLICT (seller_id) DO NOTHING;

  INSERT INTO public.seller_notifications (user_id, kind, product_title, admin_note)
  VALUES (
    _seller_id,
    'launch_creator_awarded',
    _product_title,
    format('Twój pierwszy zatwierdzony produkt zdobył miejsce #%s w akcji dla pierwszych 30 twórców. Numer miejsca pozostaje przypisany do Twojego konta.', next_slot)
  );

  RETURN next_slot;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_launch_creator_place(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_launch_creator_place(uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.award_launch_creator_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    PERFORM public.grant_launch_creator_place(NEW.seller_id, NEW.id, NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.award_launch_creator_on_publish() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_launch_creator_on_publish() TO service_role;

CREATE TRIGGER products_award_launch_creator
AFTER INSERT OR UPDATE OF status ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.award_launch_creator_on_publish();

DO $$
DECLARE
  creator record;
BEGIN
  FOR creator IN
    SELECT DISTINCT ON (p.seller_id)
      p.seller_id,
      p.id AS product_id,
      p.title,
      COALESCE(p.reviewed_at, p.created_at) AS approved_at
    FROM public.products p
    WHERE p.status = 'published'
    ORDER BY p.seller_id, COALESCE(p.reviewed_at, p.created_at), p.id
  LOOP
    PERFORM public.grant_launch_creator_place(creator.seller_id, creator.product_id, creator.title);
  END LOOP;
END;
$$;
