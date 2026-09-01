-- Drop the trigger that creates notifications on new messages (not needed, redundant with message panel)
DROP TRIGGER IF EXISTS notify_new_message_trg ON public.messages;

-- Drop the associated function
DROP FUNCTION IF EXISTS public.notify_new_message();
