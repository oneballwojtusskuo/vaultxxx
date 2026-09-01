/**
 * Single browser Supabase client for the whole app.
 *
 * Historically this file created its own client backed by plain `localStorage`,
 * which loses the session inside the Lovable preview iframe — every upload and
 * write then failed with 401 / "permission denied". Re-export the generated
 * client (brokered storage) so there is exactly one authenticated session.
 */
export { supabase } from "@/integrations/supabase/client";
