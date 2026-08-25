import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export function LikeButton({
  productId,
  sellerId,
  variant = "default",
  className = "",
}: {
  productId: string;
  sellerId?: string | null;
  variant?: "default" | "icon";
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["likes-count", productId],
    queryFn: async () => {
      const { count } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);
      return count ?? 0;
    },
  });

  const { data: ownerId } = useQuery({
    queryKey: ["product-owner", productId],
    enabled: !!user && sellerId === undefined,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("seller_id")
        .eq("id", productId)
        .maybeSingle();
      return data?.seller_id ?? null;
    },
  });

  const isOwnProduct = !!user && (sellerId ?? ownerId) === user.id;

  const { data: liked = false } = useQuery({
    queryKey: ["liked", productId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_likes")
        .select("product_id")
        .eq("product_id", productId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (liked) {
      const { error } = await supabase
        .from("product_likes")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", user.id);
      if (error) return toast.error("Nie udało się usunąć polubienia.");
    } else {
      const { error } = await supabase
        .from("product_likes")
        .insert({ product_id: productId, user_id: user.id });
      if (error) {
        if (error.code === "23505") {
          qc.invalidateQueries({ queryKey: ["liked", productId] });
          return;
        }
        return toast.error("Nie udało się zapisać polubienia.");
      }
      toast.success("Zapisano do polubionych");
    }
    qc.invalidateQueries({ queryKey: ["liked", productId] });
    qc.invalidateQueries({ queryKey: ["likes-count", productId] });
    qc.invalidateQueries({ queryKey: ["my-likes"] });
  };

  if (isOwnProduct) return null;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        className={className}
        aria-label={liked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-destructive text-destructive" : ""}`} />
      </Button>
    );
  }

  return (
    <Button variant="outline" size="lg" className={`h-12 ${className}`} onClick={toggle}>
      <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-destructive text-destructive" : ""}`} />
      {liked ? "Polubione" : "Polub"}{" "}
      {count > 0 && <span className="ml-2 text-muted-foreground">{count}</span>}
    </Button>
  );
}
