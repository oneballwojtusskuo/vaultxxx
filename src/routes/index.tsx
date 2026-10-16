import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  beforeLoad: () => {
    throw redirect({ to: "/browse" });
  },
});
