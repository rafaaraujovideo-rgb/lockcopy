import { createFileRoute, redirect } from "@tanstack/react-router";

/** Pricing lives on the homepage; send direct /pricing visits to that section. */
export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Lockcopy pricing — plans for Webflow and Framer studios" },
      { name: "description", content: "Lockcopy plans for web design studios: collect client copy and photos, approve each answer and export to Webflow or Framer. 14-day free trial." },
      { property: "og:title", content: "Lockcopy pricing — plans for Webflow and Framer studios" },
      { property: "og:description", content: "Lockcopy plans for web design studios: collect client copy and photos, approve each answer and export to Webflow or Framer. 14-day free trial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "pricing" });
  },
});
