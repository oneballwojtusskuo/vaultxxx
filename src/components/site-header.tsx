import { Link } from "@tanstack/react-router";
import { Sparkles, Search, ShoppingBag, Plus, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Vault<span className="text-gradient">X</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/browse" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Odkrywaj
          </Link>
          <Link to="/exchanges" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Wymiany
          </Link>
          <Link to="/sell" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sprzedawaj
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/browse">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/sell">
                <Button variant="default" size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
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
                  <DropdownMenuItem asChild><Link to="/dashboard">Mój panel</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/dashboard/purchases"><ShoppingBag className="h-4 w-4 mr-2"/>Zakupy</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/exchanges">Moje wymiany</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck className="h-4 w-4 mr-2"/>Panel admina</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2"/>Wyloguj
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                Zaloguj
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
