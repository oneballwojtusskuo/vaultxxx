import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * "Wróć" link that returns to the previous page in history instead of always
 * dumping the user back on the catalogue. Falls back to /browse when the page
 * was opened directly (e.g. from a shared or affiliate link).
 */
export function BackLink({ className = "", label = "Wróć" }: { className?: string; label?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    router.navigate({ to: "/browse" });
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
