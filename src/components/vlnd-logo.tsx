import logoUrl from "@/assets/vlnd-logo.png";

export function VlndLogo({ className }: { className?: string }) {
  return <img src={logoUrl} alt="vlnd" className={className} loading="eager" decoding="async" />;
}
