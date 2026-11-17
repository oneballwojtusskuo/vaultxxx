DROP TRIGGER IF EXISTS products_track_price_reduction ON public.products;
DROP TRIGGER IF EXISTS products_record_price_history ON public.products;
COMMENT ON FUNCTION public.track_product_price_reduction() IS 'DEPRECATED: price-reduction feature cancelled; no trigger calls this function.';
COMMENT ON FUNCTION public.record_product_price_history() IS 'DEPRECATED: price-history tracking cancelled; no trigger calls this function.';
COMMENT ON TABLE public.product_price_history IS 'DEPRECATED: cancelled price-reduction feature; history is no longer recorded or used by the application.';
COMMENT ON COLUMN public.products.previous_price IS 'DEPRECATED: cancelled price-reduction feature; unused by the application.';
COMMENT ON COLUMN public.products.lowest_price_before_reduction IS 'DEPRECATED: cancelled price-reduction feature; unused by the application.';
COMMENT ON COLUMN public.products.price_history_started_at IS 'DEPRECATED: cancelled price-reduction feature; unused by the application.';
COMMENT ON COLUMN public.products.reduction_reference_since IS 'DEPRECATED: cancelled price-reduction feature; unused by the application.';