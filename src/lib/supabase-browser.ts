import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK_URL = "https://vaclvpxspkankuqjegvy.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x2cHhzcGthbmt1cWplZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzEwMTMsImV4cCI6MjA5Mzc0NzAxM30.DgMLmxOXsr1HWAzvtD8XwqoyofZATMrdp53ZmKJGDi8";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  FALLBACK_KEY;

function getSupabaseConfig() {
  return { supabaseUrl, supabaseAnonKey };
}

function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  return createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let client: ReturnType<typeof createSupabaseBrowserClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseBrowserClient>, {
  get(_, prop, receiver) {
    if (!client) client = createSupabaseBrowserClient();
    return Reflect.get(client, prop, receiver);
  },
});
