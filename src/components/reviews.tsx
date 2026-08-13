import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function Stars({ value, size = 4, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  const cls = `h-${size} w-${size}`;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const StarEl = (
          <Star
            key={n}
            className={`${cls} ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"} ${onChange ? "cursor-pointer" : ""}`}
          />
        );
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} gwiazdek`}>
            {StarEl}
          </button>
        ) : (
          StarEl
        );
      })}
    </div>
  );
}

export function RatingSummary({ sellerId }: { sellerId: string }) {
  const { data } = useQuery({
    queryKey: ["seller-rating", sellerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("seller_id", sellerId);
      const arr = data ?? [];
      if (arr.length === 0) return { avg: 0, count: 0 };
      const avg = arr.reduce((s, r: any) => s + r.rating, 0) / arr.length;
      return { avg, count: arr.length };
    },
  });
  if (!data || data.count === 0) return <span className="text-sm text-muted-foreground">Brak ocen</span>;
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Stars value={Math.round(data.avg)} />
      <span className="font-semibold">{data.avg.toFixed(1)}</span>
      <span className="text-muted-foreground">({data.count})</span>
    </div>
  );
}

export function SellerReviews({ sellerId }: { sellerId: string }) {
  const { data: reviews } = useQuery({
    queryKey: ["seller-reviews", sellerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, buyer_id, product_id, product:products(id,title)")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(50);
      const arr = data ?? [];
      const buyerIds = Array.from(new Set(arr.map((r: any) => r.buyer_id)));
      if (buyerIds.length === 0) return arr;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", buyerIds);
      const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return arr.map((r: any) => ({ ...r, buyer: pmap.get(r.buyer_id) }));
    },
  });

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 rounded-xl border border-dashed border-border/50">
        Ten twórca nie ma jeszcze opinii.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r: any) => {
        const name = r.buyer?.display_name ?? r.buyer?.username ?? "Kupujący";
        const initials = name.slice(0, 1).toUpperCase();
        return (
          <div key={r.id} className="rounded-xl bg-gradient-surface border border-border/40 p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0">
                {r.buyer?.avatar_url ? (
                  <img src={r.buyer.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground font-semibold text-xs">{initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{name}</p>
                    <Stars value={r.rating} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pl-PL")}
                  </span>
                </div>
                {r.product?.title && (
                  <p className="text-xs text-muted-foreground mt-0.5">o produkcie „{r.product.title}"</p>
                )}
                {r.comment && <p className="text-sm mt-2 whitespace-pre-wrap">{r.comment}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductReviews({
  productId,
  sellerId,
  transactionId,
}: {
  productId: string;
  sellerId: string;
  transactionId?: string | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, buyer_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      const arr = data ?? [];
      const buyerIds = Array.from(new Set(arr.map((r: any) => r.buyer_id)));
      if (buyerIds.length === 0) return arr;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", buyerIds);
      const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return arr.map((r: any) => ({ ...r, buyer: pmap.get(r.buyer_id) }));
    },
  });

  const myReview = user ? reviews?.find((r: any) => r.buyer_id === user.id) : undefined;
  const canReview = !!user && !!transactionId && user.id !== sellerId && !myReview;

  const submit = async () => {
    if (!user || !transactionId) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      transaction_id: transactionId,
      product_id: productId,
      buyer_id: user.id,
      seller_id: sellerId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Dziękujemy za opinię!");
    setComment("");
    qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
    qc.invalidateQueries({ queryKey: ["seller-rating", sellerId] });
    qc.invalidateQueries({ queryKey: ["seller-reviews", sellerId] });
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Opinia usunięta");
    qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
    qc.invalidateQueries({ queryKey: ["seller-rating", sellerId] });
    qc.invalidateQueries({ queryKey: ["seller-reviews", sellerId] });
  };

  return (
    <div className="mt-10">
      <h2 className="font-display text-2xl font-bold mb-4">Opinie</h2>

      {canReview && (
        <div className="rounded-xl bg-gradient-surface border border-primary/30 p-4 mb-4">
          <p className="text-sm font-semibold mb-2">Wystaw opinię — kupiłeś ten produkt</p>
          <div className="flex items-center gap-2 mb-3">
            <Stars value={rating} size={6} onChange={setRating} />
            <span className="text-sm text-muted-foreground">{rating}/5</span>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Napisz krótką opinię (opcjonalnie)..."
            className="mb-3"
            maxLength={1000}
          />
          <Button onClick={submit} disabled={submitting} className="bg-gradient-primary text-primary-foreground shadow-glow">
            {submitting ? "Wysyłanie..." : "Opublikuj opinię"}
          </Button>
        </div>
      )}

      {(!reviews || reviews.length === 0) ? (
        <div className="text-center text-muted-foreground py-8 rounded-xl border border-dashed border-border/50">
          Brak opinii. Bądź pierwszy!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => {
            const name = r.buyer?.display_name ?? r.buyer?.username ?? "Kupujący";
            const initials = name.slice(0, 1).toUpperCase();
            const mine = user?.id === r.buyer_id;
            return (
              <div key={r.id} className="rounded-xl bg-gradient-surface border border-border/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0">
                    {r.buyer?.avatar_url ? (
                      <img src={r.buyer.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary-foreground font-semibold text-xs">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{name}</p>
                        <Stars value={r.rating} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("pl-PL")}
                        </span>
                        {mine && (
                          <button
                            onClick={() => deleteReview(r.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Usuń opinię"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm mt-2 whitespace-pre-wrap">{r.comment}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
