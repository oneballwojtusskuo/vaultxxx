import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/lib/supabase-browser";
import { FollowButton } from "@/components/follow-button";
import { VerifiedBadge } from "@/components/verified-badge";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RatingSummary, SellerReviews } from "@/components/reviews";

export const Route = createFileRoute("/u/$username")({
  component: Profile,
});

function Profile() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, is_verified_seller, created_at")
        .eq("username", username)
        .maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile!.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile!.id),
      ]);
      return { followers: followers.count ?? 0, following: following.count ?? 0 };
    },
  });

  const { data: products } = useQuery({
    queryKey: ["profile-products", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,currency,preview_url,is_tradable,downloads_count, category:categories(name,icon)")
        .eq("seller_id", profile!.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Ładowanie profilu...</div>
        <SiteFooter />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Nie znaleziono profilu</h1>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const name = profile.display_name ?? profile.username ?? "Twórca";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="rounded-2xl bg-gradient-surface border border-border/40 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-bold text-primary-foreground">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl font-bold">{name}</h1>
                {profile.is_verified_seller && <VerifiedBadge />}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-3 text-foreground/80 whitespace-pre-wrap">{profile.bio}</p>}
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {stats?.followers ?? 0} obserwujących</span>
                <span>{stats?.following ?? 0} obserwowanych</span>
                <span>{products?.length ?? 0} produktów</span>
                <RatingSummary sellerId={profile.id} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <FollowButton targetUserId={profile.id} />
              {user && user.id !== profile.id && (
                <Button variant="outline" onClick={() => navigate({ to: "/messages/$userId", params: { userId: profile.id } })}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Wiadomość
                </Button>
              )}
            </div>
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold mt-10 mb-4">Produkty</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12 rounded-xl border border-dashed border-border/50">
            Ten twórca nie ma jeszcze opublikowanych produktów.
          </div>
        )}

        <h2 className="font-display text-2xl font-bold mt-10 mb-4">Opinie o twórcy</h2>
        <SellerReviews sellerId={profile.id} />


        <div className="mt-8 text-center">
          <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground">← Przeglądaj wszystkie produkty</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
