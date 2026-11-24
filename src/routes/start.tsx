import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old trial page: the trial needs only an account, so send old links straight to sign-up. */
export const Route = createFileRoute("/start")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "signup" } });
  },
});
