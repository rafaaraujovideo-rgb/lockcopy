import { createFileRoute, redirect } from "@tanstack/react-router";

/** Pricing lives on the homepage; send direct /pricing visits to that section. */
export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "pricing" });
  },
});
