ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_paths text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.products
SET file_paths = ARRAY[file_path]
WHERE file_path IS NOT NULL AND (file_paths IS NULL OR cardinality(file_paths) = 0);

DROP TRIGGER IF EXISTS notify_new_message_trg ON public.messages;