import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Bell,
  MessageSquare,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Repeat2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { VlndLogo } from "@/components/vlnd-logo";
import { supabase } from "@/lib/supabase-browser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();

  const { data: unreadNotif = 0, refetch: refetchNotif } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      return count ?? 0;
    },
  });

  const { data: myUsername } = useQuery({
    queryKey: ["my-username", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user!.id)
        .maybeSingle();
      return data?.username ?? null;
    },
  });

  const { data: unreadMsg = 0, refetch: refetchMsg } = useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user!.id)
        .is("read_at", null);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`hdr-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetchNotif(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => refetchMsg(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchNotif, refetchMsg]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow transition-transform group-hover:scale-105 p-1">
            <VlndLogo className="h-full w-full" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight lowercase">vlnd</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/browse"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Odkrywaj
          </Link>
          <Link
            to="/exchanges"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Wymiany
          </Link>
          <Link
            to="/sell"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sprzedawaj
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <Link to="/browse">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/help">
            <Button variant="ghost" size="icon" aria-label="Pomoc">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/messages" className="relative">
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-4 w-4" />
                  <UnreadBadge count={unreadMsg} />
                </Button>
              </Link>
              <Link to="/notifications" className="relative">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                  <UnreadBadge count={unreadNotif} />
                </Button>
              </Link>
              <Link to="/sell">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow ml-1"
                >
                  <Plus className="h-4 w-4 mr-1" /> Wystaw
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" search={{ tab: "products" }}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Mój panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/u/$username"
                      params={{ username: myUsername ?? "" }}
                      disabled={!myUsername}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Mój profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/likes">
                      <Heart className="h-4 w-4 mr-2" />
                      Polubione
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" search={{ tab: "purchases" }}>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Zakupy
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" search={{ tab: "affiliate" }}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Afiliacja
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/exchanges">
                      <Repeat2 className="h-4 w-4 mr-2" />
                      Moje wymiany
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Wiadomości
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">
                      <Bell className="h-4 w-4 mr-2" />
                      Powiadomienia
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Panel admina
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Wyloguj
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
              >
                Zaloguj
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
