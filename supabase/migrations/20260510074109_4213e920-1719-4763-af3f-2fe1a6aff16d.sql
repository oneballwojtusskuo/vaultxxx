ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS license_terms JSONB NOT NULL DEFAULT jsonb_build_object(
  'commercial_use', false,
  'max_streams', null,
  'exclusive', false,
  'attribution_required', true,
  'territory', 'worldwide',
  'custom_terms', ''
);