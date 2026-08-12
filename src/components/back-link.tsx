import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Goes back to the previous page in history instead of always jumping to /browse.
 * Falls back to a given path when there is no history entry (e.g. direct link).
 */
export function BackLink({
  fallback = "/browse",
  label = "Wróć",
  className = "",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: fallback });
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
