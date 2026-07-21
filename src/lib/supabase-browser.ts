import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getSupabaseConfig() {
  const missing = [
    !supabaseUrl ? "VITE_SUPABASE_URL" : null,
    !supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    const message =
      `[vlnd] Brak konfiguracji bazy danych: ${missing.join(", ")}. ` +
      "Ustaw te zmienne w Netlify Site settings → Environment variables i zrób ponowny deploy.";
    console.error(message);
    throw new Error(message);
  }

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
