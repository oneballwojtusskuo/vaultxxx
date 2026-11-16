import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "vlnd — produkty cyfrowe od twórców" },
    { name: "description", content: "Odkrywaj, kupuj i sprzedawaj e-booki, plannery i inne produkty cyfrowe na vlnd." },
    { property: "og:title", content: "vlnd — produkty cyfrowe od twórców" },
    { property: "og:description", content: "Odkrywaj produkty cyfrowe od niezależnych twórców na vlnd." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:image", content: "https://vlnd.pl/og-vlnd.jpg" },
    { name: "twitter:image", content: "https://vlnd.pl/og-vlnd.jpg" },
  ] }),
  staticData: { sitemap: true },
  beforeLoad: () => {
    throw redirect({ to: "/browse" });
  },
});
