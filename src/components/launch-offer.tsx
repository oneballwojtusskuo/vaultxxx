import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-browser";
import { LAUNCH_CREATOR_LIMIT, launchSpotsRemaining } from "@/lib/launch";
import { productUrlKey } from "@/lib/product-links";

export function LaunchOffer() {
  const { data: awards, isLoading, isError } = useQuery({
    queryKey: ["launch-creators"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: places, error } = await supabase
        .from("launch_creators")
        .select("seller_id, product_id, slot, awarded_at")
        .order("slot");
      if (error) throw error;

      const rows = places ?? [];
      const sellerIds = rows.map((row) => row.seller_id);
      const [{ data: profiles, error: profilesError }, { data: products, error: productsError }] =
        await Promise.all([
          sellerIds.length
            ? supabase
                .from("public_creator_profiles")
                .select("id, username, display_name, avatar_url")
                .in("id", sellerIds)
            : Promise.resolve({ data: [], error: null }),
          sellerIds.length
            ? supabase
                .from("products")
                .select("id, seller_id, slug, title, preview_url, status, created_at")
                .in("seller_id", sellerIds)
                .eq("status", "published")
                .order("created_at")
            : Promise.resolve({ data: [], error: null }),
        ]);
      if (profilesError) throw profilesError;
      if (productsError) throw productsError;

      return rows.map((row) => ({
        ...row,
        profile: profiles?.find((profile) => profile.id === row.seller_id) ?? null,
        product:
          products?.find((product) => product.id === row.product_id) ??
          products?.find((product) => product.seller_id === row.seller_id) ??
          null,
      }));
    },
  });

  const remaining = awards ? launchSpotsRemaining(awards.length) : null;
  const visibleAwards = awards?.filter((award) => award.profile && award.product) ?? [];

  return (
    <section className="border-b border-border bg-muted/45" aria-labelledby="launch-title">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Akcja startowa</p>
            <h2 id="launch-title" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              Pierwszy produkt. Trwałe miejsce na vlnd.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pierwszych {LAUNCH_CREATOR_LIMIT} twórców z zatwierdzonym produktem otrzyma numer miejsca,
              wyróżnienie na tej stronie i jedną bezpłatną promocję na profilu vlnd.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup", next: "/sell" }}>
                  Wystaw pierwszy produkt <ArrowUpRight />
                </Link>
              </Button>
              <Link
                to="/regulamin"
                hash="akcja-startowa"
                className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Zasady akcji
              </Link>
            </div>
          </div>
          <div className="flex items-baseline gap-3 border-l-2 border-primary pl-5 md:min-w-44 md:flex-col md:gap-0 md:pl-6">
            <div>
              <span className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                {remaining ?? "—"}
              </span>
              <span className="ml-1 text-lg text-muted-foreground">/ {LAUNCH_CREATOR_LIMIT}</span>
            </div>
            <p className="text-sm text-muted-foreground md:mt-1">
              {isLoading ? "Sprawdzamy miejsca" : isError ? "Licznik chwilowo niedostępny" : remaining === 0 ? "Wszystkie miejsca zajęte" : "Wolne miejsca"}
            </p>
          </div>
        </div>

        {visibleAwards.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-semibold">Pierwsi twórcy na vlnd</h3>
            <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2" aria-label="Wyróżnieni twórcy">
              {visibleAwards.map((award) => {
                const profile = award.profile!;
                const name = profile.display_name || profile.username || "Twórca";
                return (
                  <article
                    key={award.seller_id}
                    className="w-64 shrink-0 snap-start rounded-xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        {profile.username ? (
                          <Link to="/u/$username" params={{ username: profile.username }} className="block truncate font-semibold hover:underline">
                            {name}
                          </Link>
                        ) : (
                          <p className="truncate font-semibold">{name}</p>
                        )}
                        <p className="mt-0.5 text-xs font-medium text-primary">Miejsce #{String(award.slot).padStart(2, "0")}</p>
                      </div>
                    </div>
                    {award.product && (
                      <Link
                        to="/product/$id"
                        params={{ id: productUrlKey(award.product) }}
                        className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {award.product.preview_url && (
                          <img src={award.product.preview_url} alt="" className="h-10 w-10 rounded-md object-cover" loading="lazy" />
                        )}
                        <span className="line-clamp-2">{award.product.title}</span>
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
