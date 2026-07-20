import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: following = false } = useQuery({
    queryKey: ["following", targetUserId, user?.id],
    enabled: !!user && user.id !== targetUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      return !!data;
    },
  });

  if (user?.id === targetUserId) return null;

  const toggle = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error) return toast.error(error.message);
      toast.success("Obserwujesz teraz tego twórcę");
    }
    qc.invalidateQueries({ queryKey: ["following", targetUserId] });
    qc.invalidateQueries({ queryKey: ["profile-stats", targetUserId] });
  };

  return (
    <Button
      onClick={toggle}
      variant={following ? "outline" : "default"}
      className={following ? "" : "bg-gradient-primary text-primary-foreground shadow-glow"}
    >
      {following ? <UserCheck className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
      {following ? "Obserwujesz" : "Obserwuj"}
    </Button>
  );
}
