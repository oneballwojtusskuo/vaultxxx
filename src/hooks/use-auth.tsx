import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

const OWNER_ADMIN_EMAIL = "chujcinaryjsuko@gmail.com";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);

      if (event === "SIGNED_IN" && typeof window !== "undefined") {
        // Clean auth tokens while preserving a guest buyer's product return URL.
        if (
          window.location.hash.includes("access_token") ||
          window.location.search.includes("code=")
        ) {
          const isSignupConfirm = window.location.hash.includes("type=signup");
          const isCheckoutReturn = new URLSearchParams(window.location.search).get("buy") === "1";
          if (isSignupConfirm && !isCheckoutReturn) {
            sessionStorage.setItem("vlnd:confirm-tab", "1");
            window.dispatchEvent(new Event("vlnd:confirm-tab"));
            toast.success(
              "Dziękujemy! Adres e-mail potwierdzony. Wróć do karty, w której zakładałeś konto — tam ustawisz nazwę użytkownika.",
              { duration: 15000 },
            );
            window.history.replaceState({}, "", "/");
          } else {
            toast.success(
              isCheckoutReturn
                ? "Adres e-mail potwierdzony — możesz dokończyć zakup."
                : "Dziękujemy! Adres e-mail potwierdzony — dokończ konfigurację konta.",
            );
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("code");
            cleanUrl.searchParams.delete("token_hash");
            cleanUrl.searchParams.delete("type");
            cleanUrl.hash = "";
            window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
          }
        }
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const evaluateAdmin = async () => {
      const userEmail = session?.user?.email?.toLowerCase();
      if (userEmail === OWNER_ADMIN_EMAIL) {
        if (isMounted) setIsAdmin(true);
        return;
      }

      if (!session?.user?.id) {
        if (isMounted) setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (isMounted) setIsAdmin(!error && !!data);
    };

    evaluateAdmin();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, session?.user?.email]);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        isAdmin,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
