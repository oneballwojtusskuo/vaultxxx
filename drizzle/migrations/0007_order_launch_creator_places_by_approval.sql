DELETE FROM public.launch_creators;

WITH first_approved AS (
  SELECT DISTINCT ON (p.seller_id)
    p.seller_id,
    p.id AS product_id,
    COALESCE(p.reviewed_at, p.created_at) AS approved_at
  FROM public.products p
  WHERE p.status = 'published'
  ORDER BY p.seller_id, COALESCE(p.reviewed_at, p.created_at), p.id
), ordered AS (
  SELECT seller_id, product_id, row_number() OVER (ORDER BY approved_at, product_id) AS slot
  FROM first_approved
  ORDER BY approved_at, product_id
  LIMIT 30
)
INSERT INTO public.launch_creators (seller_id, product_id, slot)
SELECT seller_id, product_id, slot
FROM ordered;

SELECT setval(
  'public.launch_creator_slot_seq',
  (SELECT COALESCE(MAX(slot), 0) FROM public.launch_creators),
  true
);
