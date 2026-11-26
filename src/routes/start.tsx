import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old trial page: the trial needs only an account, so send old links straight to sign-up. */
export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Start your Lockcopy free trial — 14 days, no card" },
      { name: "description", content: "Create your Lockcopy account and send your first client content checklist today. 14 days free, no credit card needed." },
      { property: "og:title", content: "Start your Lockcopy free trial — 14 days, no card" },
      { property: "og:description", content: "Create your Lockcopy account and send your first client content checklist today. 14 days free, no credit card needed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "signup" } });
  },
});
